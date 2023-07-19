const axios = require('axios');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

async function fetchOwners() {
  try {
    const input = await readFile('tokenID.json', 'utf-8');
    const tokenIds = JSON.parse(input);
    console.log(`Read token IDs: ${tokenIds}`);

    // Split the token IDs into batches of 10
    const batches = [];
    for (let i = 0; i < tokenIds.length; i += 10) {
      batches.push(tokenIds.slice(i, i + 10));
    }

    let owners = '';
    const fetchData = async (batch) => {
      // Format the token IDs into a string
      const tokenIdsString = batch.map(id => `&tokenIds=${id}`).join('');

      const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?${tokenIdsString}`;
      console.log(`URL: ${url}`);

      while (true) {
        try {
          const response = await axios.get(url);
          console.log(`Response data: ${JSON.stringify(response.data)}`);

          for (let i = 0; i < response.data.tokens.length; i++) {
            const owner = response.data.tokens[i].owner;
            owners += owner + '\n';
          }

          break; // Break the loop if the request was successful
        } catch (error) {
          console.error(`Error fetching data for token IDs: ${error.message}`);
          if (error.response) {
            console.error(`Response data: ${JSON.stringify(error.response.data)}`);
          }
          console.log('Retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        }
      }
    };

    for (const batch of batches) {
      await fetchData(batch);
    }

    await writeFile('owners.txt', owners);
    console.log('Owners written to owners.txt');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

fetchOwners();