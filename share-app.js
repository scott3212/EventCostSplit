#!/usr/bin/env node

/**
 * Share App Script
 * Helps you safely share your app with friends for testing
 */

const { execSync } = require('child_process');
const os = require('os');

function getNetworkIP() {
  const networkInterfaces = os.networkInterfaces();
  
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost';
}

function displaySharingInfo() {
  const networkIP = getNetworkIP();
  const port = process.env.PORT || 3000;
  
  console.log(`
🎉 Badminton Cost Splitter - Sharing Mode
==========================================

📱 Your local access: http://localhost:${port}
🌐 Friend's access: http://${networkIP}:${port}

📋 Instructions for your friend:
1. Open their web browser
2. Go to: http://${networkIP}:${port}
3. Start testing the app!

⚠️  Important Notes:
- Make sure your Windows Firewall allows Node.js
- Your friend needs to be on the same network (WiFi/LAN)
- This is a development version - data may be shared

🔒 For more security, consider using ngrok:
1. Install ngrok from https://ngrok.com
2. Run: ngrok http ${port}
3. Share the ngrok URL instead

🚀 Starting server...
`);

  // Start the server
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  displaySharingInfo();
}

module.exports = { getNetworkIP, displaySharingInfo };

