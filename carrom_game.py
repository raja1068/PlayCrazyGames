"""
CARROM BOARD GAME - Professional Edition
Features: 2/4 Player Modes, Physics Engine, Themes, Save/Load
Developed with Python & Pygame
"""

import pygame
import sys
import math
import json
import os
from enum import Enum
from dataclasses import dataclass
from typing import List, Tuple, Optional
import random

# Initialize Pygame
pygame.init()

# ============================================
# CONSTANTS
# ============================================

# Screen dimensions
SCREEN_WIDTH = 900
SCREEN_HEIGHT = 700
BOARD_SIZE = 600
BOARD_OFFSET_X = (SCREEN_WIDTH - BOARD_SIZE) // 2
BOARD_OFFSET_Y = 50

# Colors
class Colors:
    # Board colors
    WOOD_LIGHT = (210, 180, 140)
    WOOD_DARK = (139, 69, 19)
    BORDER = (101, 67, 33)
    
    # Pockets
    POCKET = (44, 62, 80)
    POCKET_INNER = (26, 26, 46)
    
    # Coins
    RED = (231, 76, 60)
    GREEN = (46, 204, 113)
    BLUE = (52, 152, 219)
    YELLOW = (241, 196, 15)
    ORANGE = (230, 126, 34)
    PURPLE = (155, 89, 182)
    CYAN = (26, 188, 156)
    PINK = (232, 67, 147)
    
    # Striker
    STRIKER = (255, 255, 255)
    STRIKER_OUTLINE = (149, 165, 166)
    
    # UI
    WHITE = (255, 255, 255)
    BLACK = (0, 0, 0)
    GRAY = (128, 128, 128)
    DARK_GRAY = (64, 64, 64)
    GOLD = (255, 215, 0)
    ORANGE = (255, 149, 0)
    RED_ALERT = (255, 69, 58)
    GREEN_SUCCESS = (52, 199, 89)
    
    # Themes
    THEMES = {
        'classic': {
            'board_bg': (210, 180, 140),
            'border': (101, 67, 33),
            'pocket': (44, 62, 80),
            'text': (0, 0, 0)
        },
        'modern': {
            'board_bg': (45, 45, 68),
            'border': (88, 101, 242),
            'pocket': (30, 30, 46),
            'text': (255, 255, 255)
        },
        'dark': {
            'board_bg': (28, 28, 28),
            'border': (60, 60, 60),
            'pocket': (10, 10, 10),
            'text': (200, 200, 200)
        },
        'forest': {
            'board_bg': (34, 139, 34),
            'border': (85, 107, 47),
            'pocket': (50, 50, 30),
            'text': (255, 248, 225)
        }
    }

# Physics constants
FRICTION = 0.985
POCKET_RADIUS = 18
COIN_RADIUS = 10
STRIKER_RADIUS = 12
MIN_POWER = 5
MAX_POWER = 100
POWER_MULTIPLIER = 0.4

# Game constants
WIN_SCORE = 29
QUEEN_POINTS = 50
COIN_POINTS = 10

# Pocket positions (4 corners)
POCKETS = [
    (BOARD_OFFSET_X + 35, BOARD_OFFSET_Y + 35),
    (BOARD_OFFSET_X + BOARD_SIZE - 35, BOARD_OFFSET_Y + 35),
    (BOARD_OFFSET_X + 35, BOARD_OFFSET_Y + BOARD_SIZE - 35),
    (BOARD_OFFSET_X + BOARD_SIZE - 35, BOARD_OFFSET_Y + BOARD_SIZE - 35)
]

# ============================================
# GAME MODES
# ============================================

class GameMode(Enum):
    TWO_PLAYER = 1
    FOUR_PLAYER = 2
    VS_BOT = 3

class GameState(Enum):
    MENU = 1
    PLAYING = 2
    PAUSED = 3
    GAME_OVER = 4
    SETTINGS = 5

# ============================================
# COIN CLASS
# ============================================

class Coin:
    def __init__(self, x: float, y: float, color: Tuple[int, int, int], 
                 points: int, is_queen: bool = False, player: int = None):
        self.x = x
        self.y = y
        self.radius = COIN_RADIUS
        self.color = color
        self.points = points
        self.is_queen = is_queen
        self.player = player
        self.vx = 0.0
        self.vy = 0.0
        self.pocketed = False
        self.pocket_time = 0
        
    def update(self):
        """Update coin position based on velocity"""
        if not self.pocketed:
            self.x += self.vx
            self.y += self.vy
            self.vx *= FRICTION
            self.vy *= FRICTION
            
            # Stop if velocity is very low
            if abs(self.vx) < 0.1 and abs(self.vy) < 0.1:
                self.vx = 0
                self.vy = 0
    
    def draw(self, screen, theme):
        """Draw the coin on screen"""
        if self.pocketed:
            return
            
        # 3D shadow effect
        shadow_offset = 2
        pygame.draw.circle(screen, Colors.DARK_GRAY, 
                          (int(self.x + shadow_offset), int(self.y + shadow_offset)), 
                          self.radius)
        
        # Main coin
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(screen, Colors.WHITE, (int(self.x), int(self.y)), self.radius, 1)
        
        # Highlight
        highlight_pos = (int(self.x - 3), int(self.y - 3))
        pygame.draw.circle(screen, (255, 255, 255, 100), highlight_pos, self.radius // 3)
        
        # Queen mark
        if self.is_queen:
            font = pygame.font.Font(None, 20)
            queen_text = font.render("Q", True, Colors.GOLD)
            screen.blit(queen_text, (self.x - 6, self.y - 8))
    
    def is_in_pocket(self) -> bool:
        """Check if coin is in any pocket"""
        for px, py in POCKETS:
            dist = math.hypot(self.x - px, self.y - py)
            if dist < POCKET_RADIUS:
                return True
        return False

# ============================================
# STRIKER CLASS
# ============================================

class Striker:
    def __init__(self, x: float, y: float, player: int):
        self.x = x
        self.y = y
        self.radius = STRIKER_RADIUS
        self.player = player
        self.vx = 0.0
        self.vy = 0.0
        self.moving = False
        self.drag_start = None
        self.drag_current = None
        self.power = 0
        
    def update(self):
        """Update striker position"""
        if self.moving:
            self.x += self.vx
            self.y += self.vy
            self.vx *= FRICTION
            self.vy *= FRICTION
            
            if abs(self.vx) < 0.1 and abs(self.vy) < 0.1:
                self.moving = False
                self.vx = 0
                self.vy = 0
    
    def get_aim_angle(self) -> float:
        """Get aiming angle based on drag"""
        if self.drag_start and self.drag_current:
            dx = self.drag_start[0] - self.drag_current[0]
            dy = self.drag_start[1] - self.drag_current[1]
            return math.atan2(dy, dx)
        return 0
    
    def get_power_percent(self) -> int:
        """Get power percentage based on drag distance"""
        if self.drag_start and self.drag_current:
            dx = self.drag_start[0] - self.drag_current[0]
            dy = self.drag_start[1] - self.drag_current[1]
            distance = math.hypot(dx, dy)
            return min(MAX_POWER, int(distance))
        return 0
    
    def shoot(self):
        """Execute the shot based on drag"""
        if self.drag_start and self.drag_current:
            dx = self.drag_start[0] - self.drag_current[0]
            dy = self.drag_start[1] - self.drag_current[1]
            distance = math.hypot(dx, dy)
            power = min(MAX_POWER, distance) * POWER_MULTIPLIER
            
            if power >= MIN_POWER:
                angle = math.atan2(dy, dx)
                self.vx = math.cos(angle) * power
                self.vy = math.sin(angle) * power
                self.moving = True
                return True
        return False
    
    def draw(self, screen, theme):
        """Draw the striker"""
        if self.moving:
            # Motion blur effect
            for i in range(3):
                alpha = 50 - i * 15
                blur_surface = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
                pygame.draw.circle(blur_surface, (*Colors.WHITE, alpha), 
                                 (self.radius, self.radius), self.radius - i)
                screen.blit(blur_surface, (int(self.x - self.radius), int(self.y - self.radius)))
        
        # Main striker
        pygame.draw.circle(screen, Colors.STRIKER, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(screen, Colors.STRIKER_OUTLINE, (int(self.x), int(self.y)), self.radius, 2)
        
        # Power/aim line
        if self.drag_start and self.drag_current and not self.moving:
            start = self.drag_start
            end = self.drag_current
            power_percent = self.get_power_percent()
            
            # Aim line
            pygame.draw.line(screen, Colors.ORANGE, start, end, 3)
            
            # Power indicator
            power_color = (255, int(255 * (1 - power_percent/100)), 0)
            power_end = (start[0] + (end[0] - start[0]) * 0.5,
                        start[1] + (end[1] - start[1]) * 0.5)
            pygame.draw.line(screen, power_color, start, power_end, 5)

# ============================================
# PARTICLE SYSTEM
# ============================================

class Particle:
    def __init__(self, x, y, vx, vy, color, lifetime=30):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.lifetime = lifetime
        self.initial_lifetime = lifetime
        
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.lifetime -= 1
        return self.lifetime > 0
        
    def draw(self, screen):
        alpha = int(255 * (self.lifetime / self.initial_lifetime))
        size = max(2, int(5 * (self.lifetime / self.initial_lifetime)))
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), size)

class ParticleSystem:
    def __init__(self):
        self.particles = []
        
    def add_collision(self, x, y, color):
        for _ in range(12):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(2, 6)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            self.particles.append(Particle(x, y, vx, vy, color, 20))
            
    def add_pocket(self, x, y):
        for _ in range(20):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(3, 8)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            self.particles.append(Particle(x, y, vx, vy, Colors.GOLD, 30))
            
    def update(self):
        self.particles = [p for p in self.particles if p.update()]
        
    def draw(self, screen):
        for particle in self.particles:
            particle.draw(screen)

# ============================================
# CARROM GAME CLASS
# ============================================

class CarromGame:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Carrom Board Game - Classic Strike & Pocket")
        self.clock = pygame.time.Clock()
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)
        
        # Game state
        self.game_state = GameState.MENU
        self.game_mode = GameMode.TWO_PLAYER
        self.current_player = 1
        self.players = []
        self.coins = []
        self.striker = None
        self.particle_system = ParticleSystem()
        
        # UI elements
        self.power_meter = 0
        self.dragging = False
        self.drag_start = None
        
        # Settings
        self.current_theme = 'classic'
        self.sound_enabled = True
        self.show_power_meter = True
        
        # Scores
        self.player_scores = {1: 0, 2: 0, 3: 0, 4: 0}
        self.foul_count = {1: 0, 2: 0, 3: 0, 4: 0}
        
        # Queen rule
        self.queen_covered = False
        self.queen_pocketed_by = None
        
        # Game save data
        self.save_file = "carrom_save.json"
        
        self.init_game()
        
    def init_game(self):
        """Initialize or reset the game"""
        self.coins = []
        center_x = BOARD_OFFSET_X + BOARD_SIZE // 2
        center_y = BOARD_OFFSET_Y + BOARD_SIZE // 2
        
        # Red Queen (center)
        self.coins.append(Coin(center_x, center_y, Colors.RED, QUEEN_POINTS, True))
        
        # Inner circle (6 coins)
        inner_radius = 35
        inner_colors = [Colors.GREEN, Colors.BLUE, Colors.YELLOW, 
                       Colors.ORANGE, Colors.PURPLE, Colors.CYAN]
        for i, color in enumerate(inner_colors):
            angle = i * 60 * math.pi / 180
            x = center_x + math.cos(angle) * inner_radius
            y = center_y + math.sin(angle) * inner_radius
            self.coins.append(Coin(x, y, color, COIN_POINTS, False))
        
        # Outer circle (9 coins)
        outer_radius = 65
        outer_colors = [Colors.GREEN, Colors.RED, Colors.BLUE, Colors.YELLOW,
                       Colors.ORANGE, Colors.PURPLE, Colors.CYAN, Colors.PINK, Colors.GREEN]
        for i, color in enumerate(outer_colors):
            angle = i * 40 * math.pi / 180
            x = center_x + math.cos(angle) * outer_radius
            y = center_y + math.sin(angle) * outer_radius
            self.coins.append(Coin(x, y, color, COIN_POINTS, False))
        
        # Initialize striker
        striker_x = BOARD_OFFSET_X + BOARD_SIZE // 2
        striker_y = BOARD_OFFSET_Y + BOARD_SIZE - 40
        self.striker = Striker(striker_x, striker_y, 1)
        
        # Reset scores
        self.player_scores = {1: 0, 2: 0, 3: 0, 4: 0}
        self.foul_count = {1: 0, 2: 0, 3: 0, 4: 0}
        self.queen_covered = False
        self.queen_pocketed_by = None
        self.current_player = 1
        
    def draw_board(self):
        """Draw the Carrom board"""
        theme = Colors.THEMES[self.current_theme]
        
        # Wooden base
        pygame.draw.rect(self.screen, Colors.WOOD_DARK,
                        (BOARD_OFFSET_X - 10, BOARD_OFFSET_Y - 10, 
                         BOARD_SIZE + 20, BOARD_SIZE + 20))
        
        # Playing surface
        pygame.draw.rect(self.screen, theme['board_bg'],
                        (BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_SIZE, BOARD_SIZE))
        
        # Outer border
        pygame.draw.rect(self.screen, theme['border'],
                        (BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_SIZE, BOARD_SIZE), 4)
        
        # Inner border
        pygame.draw.rect(self.screen, theme['border'],
                        (BOARD_OFFSET_X + 10, BOARD_OFFSET_Y + 10, 
                         BOARD_SIZE - 20, BOARD_SIZE - 20), 2)
        
        # Draw pockets
        for px, py in POCKETS:
            pygame.draw.circle(self.screen, Colors.POCKET, (px, py), POCKET_RADIUS)
            pygame.draw.circle(self.screen, Colors.POCKET_INNER, (px, py), POCKET_RADIUS - 5)
        
        # Center circle
        center_x = BOARD_OFFSET_X + BOARD_SIZE // 2
        center_y = BOARD_OFFSET_Y + BOARD_SIZE // 2
        pygame.draw.circle(self.screen, theme['border'], (center_x, center_y), 85, 2)
        
        # Red center circle (queen's spot)
        pygame.draw.circle(self.screen, Colors.RED, (center_x, center_y), 12)
        
        # Star in center
        star_text = self.font_medium.render("★", True, Colors.GOLD)
        self.screen.blit(star_text, (center_x - 10, center_y - 15))
        
        # Cross lines
        pygame.draw.line(self.screen, theme['border'], 
                        (center_x, center_y - 85), (center_x, center_y + 85), 1)
        pygame.draw.line(self.screen, theme['border'],
                        (center_x - 85, center_y), (center_x + 85, center_y), 1)
        pygame.draw.line(self.screen, theme['border'],
                        (center_x - 60, center_y - 60), (center_x + 60, center_y + 60), 1)
        pygame.draw.line(self.screen, theme['border'],
                        (center_x - 60, center_y + 60), (center_x + 60, center_y - 60), 1)
        
        # Baselines
        baseline_y1 = BOARD_OFFSET_Y + BOARD_SIZE - 50
        baseline_y2 = BOARD_OFFSET_Y + 50
        pygame.draw.line(self.screen, Colors.ORANGE, 
                        (center_x - 80, baseline_y1), (center_x + 80, baseline_y1), 2)
        pygame.draw.line(self.screen, Colors.ORANGE,
                        (center_x - 80, baseline_y2), (center_x + 80, baseline_y2), 2)
        
        # Baseline labels
        label1 = self.font_small.render("BASELINE", True, Colors.ORANGE)
        label2 = self.font_small.render("BASELINE", True, Colors.ORANGE)
        self.screen.blit(label1, (center_x - 35, baseline_y1 - 20))
        self.screen.blit(label2, (center_x - 35, baseline_y2 + 5))
        
        # Directional arrows (curved striking zones)
        for y_offset in [-1, 1]:
            start_angle = -60 if y_offset == -1 else 120
            end_angle = 60 if y_offset == -1 else -120
            for angle in range(start_angle, end_angle, 30):
                rad = math.radians(angle)
                x = center_x + math.cos(rad) * 120
                y = center_y + math.sin(rad) * 120 + (y_offset * 200)
                if BOARD_OFFSET_Y < y < BOARD_OFFSET_Y + BOARD_SIZE:
                    pygame.draw.circle(self.screen, Colors.GRAY, (int(x), int(y)), 3)
    
    def draw_ui(self):
        """Draw UI elements"""
        # Score panel
        panel_y = 10
        for i in range(1, 5 if self.game_mode == GameMode.FOUR_PLAYER else 3):
            if i > len(self.players) and self.game_mode != GameMode.VS_BOT:
                continue
                
            x_pos = 20 + (i - 1) * 160
            color = Colors.GOLD if self.current_player == i else Colors.WHITE
            
            # Player box
            pygame.draw.rect(self.screen, Colors.DARK_GRAY, (x_pos, panel_y, 150, 50))
            pygame.draw.rect(self.screen, color, (x_pos, panel_y, 150, 50), 2)
            
            # Player name
            if self.game_mode == GameMode.VS_BOT and i == 2:
                name = "BOT"
            else:
                name = f"PLAYER {i}"
            name_text = self.font_small.render(name, True, color)
            self.screen.blit(name_text, (x_pos + 10, panel_y + 5))
            
            # Score
            score_text = self.font_medium.render(str(self.player_scores[i]), True, Colors.GOLD)
            self.screen.blit(score_text, (x_pos + 100, panel_y + 10))
            
            # Target
            target_text = self.font_small.render(f"/{WIN_SCORE}", True, Colors.GRAY)
            self.screen.blit(target_text, (x_pos + 130, panel_y + 20))
        
        # Turn indicator
        turn_text = self.font_large.render(f"PLAYER {self.current_player}'s TURN", True, Colors.GOLD)
        turn_rect = turn_text.get_rect(center=(SCREEN_WIDTH // 2, 15))
        self.screen.blit(turn_text, turn_rect)
        
        # Power meter (during drag)
        if self.dragging and self.show_power_meter:
            power = self.striker.get_power_percent()
            meter_width = 200
            meter_height = 20
            meter_x = SCREEN_WIDTH // 2 - meter_width // 2
            meter_y = SCREEN_HEIGHT - 80
            
            # Background
            pygame.draw.rect(self.screen, Colors.DARK_GRAY, 
                           (meter_x, meter_y, meter_width, meter_height))
            # Power fill
            fill_width = int(meter_width * power / 100)
            color = (255, int(255 * (1 - power/100)), 0)
            pygame.draw.rect(self.screen, color, 
                           (meter_x, meter_y, fill_width, meter_height))
            # Border
            pygame.draw.rect(self.screen, Colors.WHITE, 
                           (meter_x, meter_y, meter_width, meter_height), 2)
            
            # Power text
            power_text = self.font_medium.render(f"POWER: {power}%", True, Colors.WHITE)
            self.screen.blit(power_text, (meter_x + meter_width // 2 - 50, meter_y - 25))
    
    def draw_menu(self):
        """Draw main menu"""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(Colors.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        title = self.font_large.render("CARROM BOARD GAME", True, Colors.GOLD)
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, 100))
        self.screen.blit(title, title_rect)
        
        subtitle = self.font_small.render("Strike & Pocket - Classic Game", True, Colors.WHITE)
        subtitle_rect = subtitle.get_rect(center=(SCREEN_WIDTH // 2, 150))
        self.screen.blit(subtitle, subtitle_rect)
        
        # Menu options
        options = [
            ("2 PLAYER MODE", GameMode.TWO_PLAYER),
            ("4 PLAYER MODE", GameMode.FOUR_PLAYER),
            ("VS BOT", GameMode.VS_BOT),
            ("SETTINGS", "settings"),
            ("QUIT", "quit")
        ]
        
        for i, (text, mode) in enumerate(options):
            y_pos = 250 + i * 60
            color = Colors.GOLD if i == 0 else Colors.WHITE
            
            option_text = self.font_medium.render(text, True, color)
            option_rect = option_text.get_rect(center=(SCREEN_WIDTH // 2, y_pos))
            
            # Hover effect
            mouse_pos = pygame.mouse.get_pos()
            if option_rect.collidepoint(mouse_pos):
                pygame.draw.rect(self.screen, Colors.GRAY, option_rect.inflate(20, 10))
                option_text = self.font_medium.render(text, True, Colors.GOLD)
            
            self.screen.blit(option_text, option_rect)
    
    def draw_pause_menu(self):
        """Draw pause menu"""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(180)
        overlay.fill(Colors.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        pause_text = self.font_large.render("GAME PAUSED", True, Colors.GOLD)
        pause_rect = pause_text.get_rect(center=(SCREEN_WIDTH // 2, 200))
        self.screen.blit(pause_text, pause_rect)
        
        options = [
            ("RESUME", "resume"),
            ("SAVE GAME", "save"),
            ("LOAD GAME", "load"),
            ("RESTART", "restart"),
            ("MAIN MENU", "menu")
        ]
        
        for i, (text, action) in enumerate(options):
            y_pos = 300 + i * 50
            option_text = self.font_medium.render(text, True, Colors.WHITE)
            option_rect = option_text.get_rect(center=(SCREEN_WIDTH // 2, y_pos))
            
            mouse_pos = pygame.mouse.get_pos()
            if option_rect.collidepoint(mouse_pos):
                pygame.draw.rect(self.screen, Colors.GRAY, option_rect.inflate(20, 10))
                option_text = self.font_medium.render(text, True, Colors.GOLD)
            
            self.screen.blit(option_text, option_rect)
    
    def draw_settings(self):
        """Draw settings menu"""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(Colors.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        title = self.font_large.render("SETTINGS", True, Colors.GOLD)
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, 100))
        self.screen.blit(title, title_rect)
        
        # Theme options
        themes = ['classic', 'modern', 'dark', 'forest']
        for i, theme in enumerate(themes):
            y_pos = 180 + i * 50
            color = Colors.GOLD if theme == self.current_theme else Colors.WHITE
            theme_text = self.font_medium.render(f"THEME: {theme.upper()}", True, color)
            theme_rect = theme_text.get_rect(center=(SCREEN_WIDTH // 2, y_pos))
            
            mouse_pos = pygame.mouse.get_pos()
            if theme_rect.collidepoint(mouse_pos):
                pygame.draw.rect(self.screen, Colors.GRAY, theme_rect.inflate(20, 10))
            
            self.screen.blit(theme_text, theme_rect)
        
        # Other settings
        sound_text = self.font_medium.render(f"SOUND: {'ON' if self.sound_enabled else 'OFF'}", 
                                            True, Colors.WHITE)
        sound_rect = sound_text.get_rect(center=(SCREEN_WIDTH // 2, 380))
        self.screen.blit(sound_text, sound_rect)
        
        power_text = self.font_medium.render(f"SHOW POWER METER: {'ON' if self.show_power_meter else 'OFF'}", 
                                            True, Colors.WHITE)
        power_rect = power_text.get_rect(center=(SCREEN_WIDTH // 2, 430))
        self.screen.blit(power_text, power_rect)
        
        # Back button
        back_text = self.font_medium.render("BACK TO MENU", True, Colors.RED)
        back_rect = back_text.get_rect(center=(SCREEN_WIDTH // 2, 520))
        self.screen.blit(back_text, back_rect)
    
    def draw_game_over(self):
        """Draw game over screen"""
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(180)
        overlay.fill(Colors.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        # Find winner
        winner = max(self.player_scores, key=self.player_scores.get)
        winner_name = f"PLAYER {winner}"
        if self.game_mode == GameMode.VS_BOT and winner == 2:
            winner_name = "BOT"
        
        game_over_text = self.font_large.render("GAME OVER", True, Colors.GOLD)
        game_over_rect = game_over_text.get_rect(center=(SCREEN_WIDTH // 2, 150))
        self.screen.blit(game_over_text, game_over_rect)
        
        winner_text = self.font_large.render(f"{winner_name} WINS!", True, Colors.GREEN_SUCCESS)
        winner_rect = winner_text.get_rect(center=(SCREEN_WIDTH // 2, 250))
        self.screen.blit(winner_text, winner_rect)
        
        score_text = self.font_medium.render(f"Final Score: {self.player_scores[winner]} points", 
                                            True, Colors.WHITE)
        score_rect = score_text.get_rect(center=(SCREEN_WIDTH // 2, 320))
        self.screen.blit(score_text, score_rect)
        
        # Play again button
        play_again_text = self.font_medium.render("PLAY AGAIN", True, Colors.GOLD)
        play_again_rect = play_again_text.get_rect(center=(SCREEN_WIDTH // 2, 420))
        pygame.draw.rect(self.screen, Colors.GRAY, play_again_rect.inflate(40, 20))
        self.screen.blit(play_again_text, play_again_rect)
        
        # Menu button
        menu_text = self.font_medium.render("MAIN MENU", True, Colors.WHITE)
        menu_rect = menu_text.get_rect(center=(SCREEN_WIDTH // 2, 490))
        self.screen.blit(menu_text, menu_rect)
    
    def handle_collisions(self):
        """Handle all game collisions"""
        # Striker boundary collision
        margin = 30
        if self.striker.moving:
            if (self.striker.x - self.striker.radius < BOARD_OFFSET_X + margin or
                self.striker.x + self.striker.radius > BOARD_OFFSET_X + BOARD_SIZE - margin):
                self.striker.vx = -self.striker.vx * 0.7
                self.striker.x = max(BOARD_OFFSET_X + margin + self.striker.radius,
                                    min(BOARD_OFFSET_X + BOARD_SIZE - margin - self.striker.radius,
                                        self.striker.x))
                self.particle_system.add_collision(self.striker.x, self.striker.y, Colors.WHITE)
            
            if (self.striker.y - self.striker.radius < BOARD_OFFSET_Y + margin or
                self.striker.y + self.striker.radius > BOARD_OFFSET_Y + BOARD_SIZE - margin):
                self.striker.vy = -self.striker.vy * 0.7
                self.striker.y = max(BOARD_OFFSET_Y + margin + self.striker.radius,
                                    min(BOARD_OFFSET_Y + BOARD_SIZE - margin - self.striker.radius,
                                        self.striker.y))
                self.particle_system.add_collision(self.striker.x, self.striker.y, Colors.WHITE)
        
        # Coin boundary collision
        for coin in self.coins:
            if not coin.pocketed:
                if (coin.x - coin.radius < BOARD_OFFSET_X + margin or
                    coin.x + coin.radius > BOARD_OFFSET_X + BOARD_SIZE - margin):
                    coin.vx = -coin.vx * 0.7
                    coin.x = max(BOARD_OFFSET_X + margin + coin.radius,
                                min(BOARD_OFFSET_X + BOARD_SIZE - margin - coin.radius, coin.x))
                    self.particle_system.add_collision(coin.x, coin.y, coin.color)
                
                if (coin.y - coin.radius < BOARD_OFFSET_Y + margin or
                    coin.y + coin.radius > BOARD_OFFSET_Y + BOARD_SIZE - margin):
                    coin.vy = -coin.vy * 0.7
                    coin.y = max(BOARD_OFFSET_Y + margin + coin.radius,
                                min(BOARD_OFFSET_Y + BOARD_SIZE - margin - coin.radius, coin.y))
                    self.particle_system.add_collision(coin.x, coin.y, coin.color)
        
        # Striker vs Coins collision
        for coin in self.coins:
            if not coin.pocketed and self.striker.moving:
                dx = coin.x - self.striker.x
                dy = coin.y - self.striker.y
                dist = math.hypot(dx, dy)
                
                if dist < self.striker.radius + coin.radius:
                    # Collision response
                    angle = math.atan2(dy, dx)
                    speed = math.hypot(self.striker.vx, self.striker.vy)
                    force = speed * 1.2
                    
                    coin.vx = math.cos(angle) * force
                    coin.vy = math.sin(angle) * force
                    
                    # Particle effect
                    self.particle_system.add_collision(coin.x, coin.y, coin.color)
        
        # Coin vs Coin collisions
        for i in range(len(self.coins)):
            for j in range(i + 1, len(self.coins)):
                if not self.coins[i].pocketed and not self.coins[j].pocketed:
                    dx = self.coins[i].x - self.coins[j].x
                    dy = self.coins[i].y - self.coins[j].y
                    dist = math.hypot(dx, dy)
                    
                    if dist < self.coins[i].radius + self.coins[j].radius:
                        angle = math.atan2(dy, dx)
                        overlap = self.coins[i].radius + self.coins[j].radius - dist
                        
                        # Separate coins
                        move_x = math.cos(angle) * overlap / 2
                        move_y = math.sin(angle) * overlap / 2
                        self.coins[i].x += move_x
                        self.coins[i].y += move_y
                        self.coins[j].x -= move_x
                        self.coins[j].y -= move_y
                        
                        # Exchange velocities
                        vx1, vy1 = self.coins[i].vx, self.coins[i].vy
                        self.coins[i].vx = self.coins[j].vx
                        self.coins[i].vy = self.coins[j].vy
                        self.coins[j].vx = vx1
                        self.coins[j].vy = vy1
                        
                        self.particle_system.add_collision((self.coins[i].x + self.coins[j].x)/2,
                                                          (self.coins[i].y + self.coins[j].y)/2,
                                                          self.coins[i].color)
    
    def check_pocketed_coins(self):
        """Check and process pocketed coins"""
        for coin in self.coins[:]:  # Iterate over copy
            if not coin.pocketed and coin.is_in_pocket():
                coin.pocketed = True
                self.particle_system.add_pocket(coin.x, coin.y)
                
                if coin.is_queen:
                    # Queen rule: must be covered (pocketed after another coin)
                    other_coins = [c for c in self.coins if not c.pocketed and not c.is_queen]
                    if len(other_coins) > 0 and len(other_coins) < 15:
                        points = QUEEN_POINTS
                        self.queen_covered = True
                        self.queen_pocketed_by = self.current_player
                    else:
                        points = 0  # Queen without cover - no points
                else:
                    points = COIN_POINTS
                
                self.player_scores[self.current_player] += points
                
                # Check win condition
                if self.player_scores[self.current_player] >= WIN_SCORE:
                    self.game_state = GameState.GAME_OVER
    
    def check_fouls(self):
        """Check for foul conditions"""
        foul = False
        
        # Check if striker is pocketed
        for px, py in POCKETS:
            dist = math.hypot(self.striker.x - px, self.striker.y - py)
            if dist < POCKET_RADIUS:
                foul = True
                break
        
        # Check if opponent's coin is pocketed (in 2/4 player mode)
        # (Simplified - full implementation would track coin ownership)
        
        if foul:
            self.foul_count[self.current_player] += 1
            # Penalty: -5 points
            self.player_scores[self.current_player] = max(0, self.player_scores[self.current_player] - 5)
            # Switch turn
            self.next_turn()
            return True
        return False
    
    def next_turn(self):
        """Switch to next player"""
        if self.game_mode == GameMode.TWO_PLAYER:
            self.current_player = 2 if self.current_player == 1 else 1
        elif self.game_mode == GameMode.FOUR_PLAYER:
            self.current_player = (self.current_player % 4) + 1
        elif self.game_mode == GameMode.VS_BOT:
            self.current_player = 2 if self.current_player == 1 else 1
        
        # Reset striker position for new player
        if self.current_player == 1:
            self.striker.x = BOARD_OFFSET_X + BOARD_SIZE // 2
            self.striker.y = BOARD_OFFSET_Y + BOARD_SIZE - 40
        else:
            self.striker.x = BOARD_OFFSET_X + BOARD_SIZE // 2
            self.striker.y = BOARD_OFFSET_Y + 40
        
        self.striker.vx = 0
        self.striker.vy = 0
        self.striker.moving = False
        
        # Bot move (if applicable)
        if self.game_mode == GameMode.VS_BOT and self.current_player == 2:
            self.bot_move()
    
    def bot_move(self):
        """Simple bot AI for VS BOT mode"""
        import time
        
        # Find target coin
        target_coin = None
        min_distance = float('inf')
        
        for coin in self.coins:
            if not coin.pocketed and not coin.is_queen:
                dist = math.hypot(coin.x - self.striker.x, coin.y - self.striker.y)
                if dist < min_distance:
                    min_distance = dist
                    target_coin = coin
        
        if target_coin:
            # Calculate aim direction
            dx = target_coin.x - self.striker.x
            dy = target_coin.y - self.striker.y
            angle = math.atan2(dy, dx)
            
            # Calculate power based on distance
            power = min(MAX_POWER, int(min_distance / 2))
            
            # Simulate drag and shoot
            drag_end_x = self.striker.x - math.cos(angle) * power
            drag_end_y = self.striker.y - math.sin(angle) * power
            
            self.striker.drag_start = (self.striker.x, self.striker.y)
            self.striker.drag_current = (drag_end_x, drag_end_y)
            self.striker.power = power
            
            # Shoot after delay
            pygame.time.wait(500)
            self.striker.shoot()
            self.dragging = False
            self.striker.drag_start = None
            self.striker.drag_current = None
    
    def save_game(self):
        """Save current game state to file"""
        save_data = {
            'player_scores': self.player_scores,
            'foul_count': self.foul_count,
            'current_player': self.current_player,
            'game_mode': self.game_mode.value,
            'current_theme': self.current_theme,
            'coins': [(c.x, c.y, c.vx, c.vy, c.pocketed, c.is_queen, c.points) for c in self.coins],
            'striker': (self.striker.x, self.striker.y, self.striker.vx, self.striker.vy, self.striker.moving)
        }
        
        with open(self.save_file, 'w') as f:
            json.dump(save_data, f)
        
        return True
    
    def load_game(self):
        """Load game state from file"""
        if not os.path.exists(self.save_file):
            return False
        
        with open(self.save_file, 'r') as f:
            save_data = json.load(f)
        
        self.player_scores = save_data['player_scores']
        self.foul_count = save_data['foul_count']
        self.current_player = save_data['current_player']
        self.game_mode = GameMode(save_data['game_mode'])
        self.current_theme = save_data['current_theme']
        
        # Restore coins
        self.coins = []
        for coin_data in save_data['coins']:
            x, y, vx, vy, pocketed, is_queen, points = coin_data
            coin = Coin(x, y, Colors.RED if is_queen else Colors.GREEN, points, is_queen)
            coin.vx = vx
            coin.vy = vy
            coin.pocketed = pocketed
            self.coins.append(coin)
        
        # Restore striker
        sx, sy, svx, svy, moving = save_data['striker']
        self.striker = Striker(sx, sy, self.current_player)
        self.striker.vx = svx
        self.striker.vy = svy
        self.striker.moving = moving
        
        return True
    
    def run(self):
        """Main game loop"""
        running = True
        
        while running:
            # Event handling
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        if self.game_state == GameState.PLAYING:
                            self.game_state = GameState.PAUSED
                        elif self.game_state == GameState.PAUSED:
                            self.game_state = GameState.PLAYING
                    
                    elif event.key == pygame.K_s and self.game_state == GameState.PAUSED:
                        self.save_game()
                    
                    elif event.key == pygame.K_l and self.game_state == GameState.PAUSED:
                        self.load_game()
                        self.game_state = GameState.PLAYING
                
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if self.game_state == GameState.PLAYING and not self.striker.moving:
                        # Check if click is on striker
                        mouse_pos = pygame.mouse.get_pos()
                        dist = math.hypot(mouse_pos[0] - self.striker.x, 
                                        mouse_pos[1] - self.striker.y)
                        if dist < self.striker.radius:
                            self.dragging = True
                            self.striker.drag_start = mouse_pos
                            self.striker.drag_current = mouse_pos
                
                elif event.type == pygame.MOUSEBUTTONUP:
                    if self.dragging and self.game_state == GameState.PLAYING:
                        self.dragging = False
                        if self.striker.shoot():
                            # Wait for shot to complete before next turn
                            self.striker.drag_start = None
                            self.striker.drag_current = None
                
                elif event.type == pygame.MOUSEMOTION:
                    if self.dragging:
                        self.striker.drag_current = pygame.mouse.get_pos()
                
                elif event.type == pygame.MOUSEBUTTONDOWN and self.game_state == GameState.MENU:
                    mouse_pos = pygame.mouse.get_pos()
                    options_y = [250, 310, 370, 430, 490]
                    for i, y in enumerate(options_y):
                        rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, y - 15, 200, 30)
                        if rect.collidepoint(mouse_pos):
                            if i == 0:
                                self.game_mode = GameMode.TWO_PLAYER
                                self.init_game()
                                self.game_state = GameState.PLAYING
                            elif i == 1:
                                self.game_mode = GameMode.FOUR_PLAYER
                                self.init_game()
                                self.game_state = GameState.PLAYING
                            elif i == 2:
                                self.game_mode = GameMode.VS_BOT
                                self.init_game()
                                self.game_state = GameState.PLAYING
                            elif i == 3:
                                self.game_state = GameState.SETTINGS
                            elif i == 4:
                                running = False
                
                elif event.type == pygame.MOUSEBUTTONDOWN and self.game_state == GameState.SETTINGS:
                    mouse_pos = pygame.mouse.get_pos()
                    themes_y = [180, 230, 280, 330]
                    for i, y in enumerate(themes_y):
                        rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, y - 15, 200, 30)
                        if rect.collidepoint(mouse_pos):
                            self.current_theme = ['classic', 'modern', 'dark', 'forest'][i]
                    
                    sound_rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, 365, 200, 30)
                    if sound_rect.collidepoint(mouse_pos):
                        self.sound_enabled = not self.sound_enabled
                    
                    power_rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, 415, 200, 30)
                    if power_rect.collidepoint(mouse_pos):
                        self.show_power_meter = not self.show_power_meter
                    
                    back_rect = pygame.Rect(SCREEN_WIDTH // 2 - 80, 505, 160, 30)
                    if back_rect.collidepoint(mouse_pos):
                        self.game_state = GameState.MENU
                
                elif event.type == pygame.MOUSEBUTTONDOWN and self.game_state == GameState.PAUSED:
                    mouse_pos = pygame.mouse.get_pos()
                    options_y = [300, 350, 400, 450, 500]
                    actions = ['resume', 'save', 'load', 'restart', 'menu']
                    for i, y in enumerate(options_y):
                        rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, y - 15, 200, 30)
                        if rect.collidepoint(mouse_pos):
                            if actions[i] == 'resume':
                                self.game_state = GameState.PLAYING
                            elif actions[i] == 'save':
                                self.save_game()
                            elif actions[i] == 'load':
                                self.load_game()
                                self.game_state = GameState.PLAYING
                            elif actions[i] == 'restart':
                                self.init_game()
                                self.game_state = GameState.PLAYING
                            elif actions[i] == 'menu':
                                self.game_state = GameState.MENU
                
                elif event.type == pygame.MOUSEBUTTONDOWN and self.game_state == GameState.GAME_OVER:
                    mouse_pos = pygame.mouse.get_pos()
                    play_again_rect = pygame.Rect(SCREEN_WIDTH // 2 - 80, 405, 160, 40)
                    menu_rect = pygame.Rect(SCREEN_WIDTH // 2 - 80, 475, 160, 40)
                    
                    if play_again_rect.collidepoint(mouse_pos):
                        self.init_game()
                        self.game_state = GameState.PLAYING
                    elif menu_rect.collidepoint(mouse_pos):
                        self.game_state = GameState.MENU
            
            # Update game state
            if self.game_state == GameState.PLAYING:
                # Update objects
                self.striker.update()
                for coin in self.coins:
                    coin.update()
                
                # Handle collisions and game logic
                self.handle_collisions()
                self.check_pocketed_coins()
                
                # Check if turn should end
                if not self.striker.moving and not any(abs(c.vx) > 0.1 or abs(c.vy) > 0.1 
                                                      for c in self.coins if not c.pocketed):
                    if not self.check_fouls():
                        # Check if player scored
                        # If no coins pocketed, switch turn
                        # (Simplified - full implementation would track pocketed coins this turn)
                        pass
                
                self.particle_system.update()
            
            # Drawing
            self.screen.fill(Colors.BLACK)
            
            if self.game_state == GameState.MENU:
                self.draw_menu()
            elif self.game_state == GameState.SETTINGS:
                self.draw_board()
                self.draw_ui()
                self.draw_settings()
            elif self.game_state == GameState.PLAYING:
                self.draw_board()
                for coin in self.coins:
                    coin.draw(self.screen, self.current_theme)
                self.striker.draw(self.screen, self.current_theme)
                self.particle_system.draw(self.screen)
                self.draw_ui()
            elif self.game_state == GameState.PAUSED:
                self.draw_board()
                for coin in self.coins:
                    coin.draw(self.screen, self.current_theme)
                self.striker.draw(self.screen, self.current_theme)
                self.draw_ui()
                self.draw_pause_menu()
            elif self.game_state == GameState.GAME_OVER:
                self.draw_board()
                for coin in self.coins:
                    coin.draw(self.screen, self.current_theme)
                self.draw_ui()
                self.draw_game_over()
            
            pygame.display.flip()
            self.clock.tick(60)
        
        pygame.quit()
        sys.exit()


# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    game = CarromGame()
    game.run()
