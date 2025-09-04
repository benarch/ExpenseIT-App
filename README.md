# ExpenseIT - Smart Receipt Scanner

A comprehensive mobile-first expense tracking application with OCR receipt scanning capabilities.

## Features

### 📱 Core Functionality
- **Camera Receipt Scanning**: Capture receipts using device camera
- **Image Upload**: Upload receipt images from gallery
- **Manual Entry**: Enter expenses manually
- **OCR Text Extraction**: Automatic text extraction from receipts using Tesseract.js
- **Smart Categorization**: Auto-categorize merchants based on business type

### 💰 Expense Management
- **Multi-Currency Support**: USD, EUR, ILS, GBP, JPY, CAD, AUD, AED
- **Category System**: Hotel & Lodging, Customer Meeting, Car Related, Transportation, Office Supplies, Travel, Entertainment, Restaurant, Food, Groceries, Other
- **Payment Methods**: Cash, Credit Card, App, Wire Transfer, Check
- **Attendee Tracking**: Add multiple attendees with name, company, and title
- **Cost Center**: Optional cost center assignment

### 📊 Data Export & Management
- **CSV Export**: Export expenses to CSV format
- **Data Backup**: Export all data as JSON
- **Filtering**: Filter expenses by category
- **Local Storage**: All data stored locally, no cloud dependency

### 🎨 User Experience
- **Responsive Design**: Works on desktop and mobile browsers
- **Dark/Light Theme**: Toggle between themes
- **Bottom Navigation**: Easy mobile navigation
- **Progressive Web App**: Installable on mobile devices
- **Offline Support**: Works without internet connection

### 🌐 Multi-Language Support
- **Currency Detection**: Automatic currency assignment based on receipt language
- **Hebrew Support**: Hebrew receipts default to ILS currency
- **English Support**: English receipts default to USD currency

## Installation

1. Clone or download the repository
2. Open `index.html` in a web browser
3. For mobile installation, use "Add to Home Screen" in your mobile browser

## File Structure

```
expense_it-app--slim/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── app.js             # Main JavaScript application
├── manifest.json      # PWA manifest
├── sw.js             # Service worker for offline support
└── README.md         # This file
```

## Technology Stack

- **HTML5**: Semantic markup and modern web standards
- **CSS3**: CSS Grid, Flexbox, CSS Variables for theming
- **JavaScript ES6+**: Modern JavaScript features
- **Tesseract.js**: OCR text extraction library
- **PWA**: Progressive Web App capabilities
- **Local Storage**: Client-side data persistence

## Browser Compatibility

- **Mobile**: iOS Safari, Android Chrome, Samsung Internet
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Camera Access**: Requires HTTPS in production for camera API

## Usage

### Adding Expenses

1. **Scan Receipt**: Tap camera button to capture receipt
2. **Upload Image**: Tap upload button to select from gallery
3. **Manual Entry**: Tap manual entry to input directly

### OCR Processing

The app automatically:
- Extracts merchant name from receipt
- Detects amount and currency
- Identifies date information
- Suggests category based on merchant type

### Data Management

- **View Expenses**: Switch to "My Expenses" tab
- **Export Data**: Use export button for CSV download
- **Filter**: Use category filter to view specific types
- **Settings**: Customize default currency and auto-categorization

### Themes

Toggle between light and dark themes using the moon/sun icon in the header.

## Privacy & Security

- All data stored locally in browser
- No external servers or cloud services required
- OCR processing done client-side
- Export functionality for data portability

## Development

To modify or extend the app:

1. Edit `styles.css` for visual changes
2. Modify `app.js` for functionality updates
3. Update `index.html` for structure changes
4. Test on multiple devices and browsers

## Future Enhancements

- Google Places API integration for merchant search
- Receipt image enhancement before OCR
- Expense report templates
- Integration with accounting software
- Machine learning for better categorization
- Expense analytics and charts

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please refer to the application's About section or check the console for debugging information.
