// get-ip.js - Run this to get your local IP address
const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`Your local IP address is: ${interface.address}`);
        console.log(`Update constants.js with: http://${interface.address}:5000/api`);
        return interface.address;
      }
    }
  }
  
  console.log('Could not find local IP address');
  return null;
}

getLocalIPAddress();
