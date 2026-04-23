<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Profile - Masoom India</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        /* Company Profile Card */
        .profile-container {
            max-width: 500px;
            width: 100%;
            margin: 0 auto;
        }

        .company-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }

        .company-card:hover {
            transform: translateY(-5px);
        }

        /* Header Section */
        .card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .card-header h1 {
            font-size: 1.8rem;
            margin-bottom: 5px;
        }

        .card-header p {
            opacity: 0.9;
            font-size: 0.9rem;
        }

        /* Logo/Brand Icon */
        .brand-icon {
            font-size: 4rem;
            margin-bottom: 15px;
        }

        /* Content Section */
        .card-content {
            padding: 25px;
        }

        /* Info Section */
        .info-section {
            margin-bottom: 25px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }

        .info-title {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #667eea;
            font-size: 1.2rem;
            margin-bottom: 15px;
            font-weight: bold;
        }

        .info-detail {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
            color: #555;
            line-height: 1.5;
        }

        .info-icon {
            font-size: 1.2rem;
            min-width: 25px;
            text-align: center;
        }

        .info-text {
            flex: 1;
        }

        .info-text strong {
            color: #333;
        }

        .address-text {
            font-style: normal;
            line-height: 1.6;
        }

        /* WhatsApp Button */
        .whatsapp-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #25D366;
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            text-decoration: none;
            margin-top: 10px;
            transition: transform 0.2s, background 0.2s;
            font-weight: bold;
        }

        .whatsapp-btn:hover {
            transform: scale(1.05);
            background: #128C7E;
        }

        /* Map Placeholder */
        .map-placeholder {
            background: #f0f0f0;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            border: 1px dashed #ccc;
        }

        .map-placeholder a {
            color: #667eea;
            text-decoration: none;
        }

        /* Business Hours */
        .hours-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 15px;
            margin-top: 15px;
        }

        .hours-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }

        .hours-row:last-child {
            border-bottom: none;
        }

        .hours-day {
            font-weight: bold;
            color: #555;
        }

        .hours-time {
            color: #667eea;
        }

        /* Social Links */
        .social-links {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }

        .social-link {
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
            transition: opacity 0.2s;
        }

        .social-link:hover {
            opacity: 0.7;
        }

        /* Footer */
        .card-footer {
            background: #f8f9fa;
            padding: 15px;
            text-align: center;
            font-size: 0.8rem;
            color: #888;
            border-top: 1px solid #eee;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .card-header h1 { font-size: 1.4rem; }
            .card-content { padding: 20px; }
            .info-detail { font-size: 0.9rem; }
        }
    </style>
</head>
<body>
    <div class="profile-container">
        <div class="company-card">
            <!-- Header -->
            <div class="card-header">
                <div class="brand-icon">🏢</div>
                <h1>Masoom India</h1>
                <p>Bigcat Division 10</p>
            </div>

            <!-- Content -->
            <div class="card-content">
                <!-- Location Section -->
                <div class="info-section">
                    <div class="info-title">
                        <span>📍</span> Office Location
                    </div>
                    <div class="info-detail">
                        <div class="info-icon">🏠</div>
                        <div class="info-text address-text">
                            PurbaPara, KK Abasan,<br>
                            Krishnapur, Kolkata - 700102<br>
                            West Bengal, India
                        </div>
                    </div>
                </div>

                <!-- Contact Section -->
                <div class="info-section">
                    <div class="info-title">
                        <span>📞</span> Contact Information
                    </div>
                    <div class="info-detail">
                        <div class="info-icon">📧</div>
                        <div class="info-text">
                            <strong>Email:</strong> <a href="mailto:masoomindia7@gmail.com" style="color: #667eea; text-decoration: none;">masoomindia7@gmail.com</a>
                        </div>
                    </div>
                    <div class="info-detail">
                        <div class="info-icon">📱</div>
                        <div class="info-text">
                            <strong>Phone/WhatsApp:</strong> +91 9874234631<br>
                            <a href="https://wa.me/919874234631" target="_blank" class="whatsapp-btn">
                                💬 Message on WhatsApp
                            </a>
                            <span style="display: block; font-size: 0.8rem; color: #999; margin-top: 5px;">(WhatsApp Only)</span>
                        </div>
                    </div>
                </div>

                <!-- Map Location -->
                <div class="map-placeholder">
                    <div style="margin-bottom: 10px;">🗺️</div>
                    <p style="margin-bottom: 8px; color: #666;">Krishnapur, Kolkata - 700102</p>
                    <a href="https://maps.google.com/?q=Krishnapur+Kolkata+700102" target="_blank">View on Google Maps →</a>
                </div>

                <!-- Business Hours -->
                <div class="hours-section">
                    <div class="info-title" style="margin-bottom: 15px;">
                        <span>⏰</span> Business Hours
                    </div>
                    <div class="hours-row">
                        <span class="hours-day">Monday - Friday</span>
                        <span class="hours-time">10:00 AM - 7:00 PM</span>
                    </div>
                    <div class="hours-row">
                        <span class="hours-day">Saturday</span>
                        <span class="hours-time">10:00 AM - 4:00 PM</span>
                    </div>
                    <div class="hours-row">
                        <span class="hours-day">Sunday</span>
                        <span class="hours-time">Closed</span>
                    </div>
                    <div class="hours-row">
                        <span class="hours-day">Support (Email/WhatsApp)</span>
                        <span class="hours-time">24/7 Available</span>
                    </div>
                </div>

                <!-- Social Links -->
                <div class="social-links">
                    <a href="mailto:masoomindia7@gmail.com" class="social-link">📧 Email</a>
                    <a href="https://wa.me/919874234631" target="_blank" class="social-link">💬 WhatsApp</a>
                    <a href="#" class="social-link">🐙 GitHub</a>
                </div>
            </div>

            <!-- Footer -->
            <div class="card-footer">
                <p>© 2024 Masoom India | Bigcat Divn. 10</p>
                <p style="margin-top: 5px;">PlayCrazyGames - A Division of Masoom India</p>
            </div>
        </div>
    </div>
</body>
</html>
