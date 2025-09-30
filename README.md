# Seven Knights: Rebirth Farm Simulator

A web-based simulator for calculating farming efficiency in the mobile game "Seven Knights: Rebirth". This tool helps players optimize their auto-farming strategies by calculating key regeneration, experience gain, and ruby profit.

## Features

- **Farming Simulation**: Calculate optimal farming strategies for different game modes
- **Key Management**: Track key regeneration and consumption
- **Experience Calculation**: Determine rounds needed to level heroes to 30
- **Ruby Profit Analysis**: Calculate net profit from farming activities
- **Monthly Pack Integration**: Factor in monthly subscription benefits
- **Time Period Customization**: Set custom farming time windows
- **Multiple Map Support**: Support for both Normal and Nightmare mode maps

## Installation

1. Clone this repository:
```bash
git clone https://github.com/YOUR_USERNAME/seven-knights-farm-simulator.git
cd seven-knights-farm-simulator
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
node app.js
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Set Initial Parameters**:
   - Enter your starting keys
   - Select the map you want to farm
   - Set your farming time period

2. **Configure Key Purchases**:
   - Specify how many key packs you want to buy with rubies
   - Choose from 50, 80, or 100 ruby packs

3. **Enable Monthly Packs**:
   - Check the boxes for monthly subscription benefits
   - EXP +10% boost
   - Key regeneration time reduction

4. **View Results**:
   - See calculated farming efficiency
   - View expected ruby profit/loss
   - Check time requirements

## Game Modes

### Normal Mode
- 6 keys per round
- 4 heroes per round
- Various EXP values per map

### Nightmare Mode
- 12 keys per round
- 8 heroes per round
- Higher EXP values

## Technical Details

- **Framework**: Node.js with Express
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Port**: 3000 (configurable via PORT environment variable)

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
