module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 7545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.16",
      settings: {   
       optimizer: {
         enabled: false,
         runs: 200
       }
      }
    }
  },
  contracts_directory:'contracts',
  contracts_build_directory : 'abis'
};
