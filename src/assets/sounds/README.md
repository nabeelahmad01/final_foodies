# Sound Assets

## Required Sound Files

Please add the following sound files to this directory:

### notification.mp3
- **Purpose**: Order notification sound for riders and customers
- **Duration**: 2-3 seconds
- **Format**: MP3
- **Volume**: Medium (not too loud)
- **Tone**: Pleasant notification sound (like a bell or chime)

### Example sources for notification sounds:
- https://freesound.org/
- https://zapsplat.com/
- https://mixkit.co/free-sound-effects/

## Usage

The notification sound is used in:
- OrderTrackingScreen.js - When order status updates
- Rider notifications - When new orders are available
- Customer notifications - When rider is assigned

## Implementation

```javascript
// Load sound
const { sound } = await Audio.Sound.createAsync(
  require('./notification.mp3'),
  { shouldPlay: false }
);

// Play sound
await sound.replayAsync();
```
