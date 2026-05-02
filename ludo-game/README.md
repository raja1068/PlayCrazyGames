# 🎲 Ludo Classic Game

A fully functional, responsive Ludo board game built with vanilla HTML5, CSS3, and JavaScript. No frameworks required!

## 🎯 Features

### Board Design
- ✅ 15×15 CSS Grid layout matching classic Ludo design
- ✅ 4 colored yards (Red, Green, Yellow, Blue) in corners
- ✅ 4 tokens per color properly positioned in yards
- ✅ Continuous clockwise movement path
- ✅ ⭐ Safe zones (star-marked cells) - tokens cannot be captured here
- ✅ 🎯 Home columns (colored paths leading to center)
- ✅ 🔺 Central home triangle with 4 colored sections
- ✅ Fully responsive (mobile + desktop)

### Game Logic
- ✅ Support for 2-4 players (turn-based clockwise)
- ✅ Random dice roll (1-6) with CSS animation
- ✅ Need 6 to bring token out of yard
- ✅ Extra turn on rolling 6
- ✅ Three consecutive 6s cancels turn
- ✅ Tokens move exact steps along path
- ✅ Home entry only after full loop completion
- ✅ Collision: landing on opponent sends them back to yard
- ✅ Safe zones prevent capture
- ✅ Capture gives extra turn

### Interaction
- ✅ Clickable/selectable tokens
- ✅ Only valid moves allowed
- ✅ Smooth movement animations
- ✅ Active player highlighting
- ✅ Possible moves highlighting

### Win Condition
- ✅ Exact dice roll needed to enter home triangle
- ✅ Track completed tokens per player
- ✅ First to move all 4 tokens home wins
- ✅ Victory overlay modal with restart option

## 🚀 How to Play

1. Open `index.html` in any modern browser
2. Players take turns clockwise: 🔴 Red → 🟢 Green → 🟡 Yellow → 🔵 Blue
3. Click "Roll Dice" to roll (or press 'R' key)
4. Roll a 6 to bring a token out of your yard
5. Click on any highlighted token to move it
6. Land on opponent's token to send it back to its yard
7. First to get all 4 tokens to center wins!

## 🎮 Controls

- **Roll Dice**: Click the dice or press 'R' key
- **Select Token**: Click on any highlighted token
- **New Game**: Click "New Game" button or press 'N' key

## 📁 Project Structure
ludo-game/
├── index.html # Main HTML structure
├── css/
│ └── style.css # Styling, animations, responsiveness
├── js/
│ ├── board.js # Board layout, path definitions, rendering
│ ├── player.js # Token & Player classes, movement, collision
│ ├── game.js # Game state, turn management, win logic
│ └── main.js # Entry point, event listeners
└── README.md # Documentation


## 🔧 Technical Details

### Path System
- 52 movement cells forming complete clockwise loop
- Index-based position tracking (0-51)
- Separate home stretch arrays (6 steps per color)
- Safe zone indices prevent captures

### Collision Detection
- Checks opponent tokens at same path index
- Ignores safe zones (star cells)
- Sends captured token back to yard
- Grants extra turn on capture

### Turn Management
- Clockwise rotation through players
- Extra turn tracking for 6s and captures
- Three consecutive 6s penalty
- Automatic turn pass when no moves available

## 🎨 Customization

You can easily modify:
- Colors in CSS variables
- Token count per player
- Board dimensions (maintain 15×15 for layout)
- Animation speeds in CSS

## 📱 Responsive Design

- Adapts to any screen size
- Touch-friendly for mobile devices
- Maintains square board aspect ratio
- Collapsible controls on small screens

## 🛠️ Built With

- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- No external dependencies or frameworks

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

**Enjoy the game!** 🎲🏆
