const puppeteer = require('puppeteer');

// Load .env file
require('dotenv').config();


// Constants
const NODE_ENV  = process.env.NODE_ENV;
const USER_NAME = process.env.USER_NAME;
const PASSWORD  = process.env.PASSWORD;
const ITERATION = process.env.ITERATION || 30;

const dev = NODE_ENV === 'development';

function invite() {

  // Constants
  var btnName = 'Connect';
  var timeout = 2000; // 2s
  
  // Utilities
  var notDisabledAndHaveInviteName = (btn)  => !btn.disabled && btn.innerHTML.indexOf(btnName) != -1
  var toClickTask                  = (btn)  => () => notDisabledAndHaveInviteName(btn) ? btn.click() : null;
  var delay                        = (time) => new Promise(resolve => setTimeout(resolve, time));
  var delay2s                      = ()     => delay(timeout);
  var logTaskNumber                = (i)    => () => console.log(i)
  var promiseChainingReducer       = (promise, task, index) => { 
                                        return promise
                                                .then(delay2s)
                                                .then(logTaskNumber(index))
                                                .then(task)
                                      };

  var logDone                      = ()     => console.log('Done')
  var scroll                       = ()     => window.scrollBy(0, window.innerHeight);

  function scroll3Times() {
    console.log('Scroll 3 times.')
    return Promise.resolve()
      .then(delay2s)
      .then(scroll)
      .then(delay2s)
      .then(scroll)
      .then(delay2s)
      .then(scroll)
  }

 
  function getInviteBtnThenClick() {

    // Main program
    var btns         = document.getElementsByClassName('button-secondary-small');
    var filteredBtns = Array
                        .from(btns)
                        .filter(notDisabledAndHaveInviteName);

    console.log('Total selected buttons: '  , btns.length)
    console.log('Number of invite buttons: ', filteredBtns.length)

    return filteredBtns
      .reverse()
      .map(toClickTask)
      .reduce(promiseChainingReducer, Promise.resolve())
      .then(logDone)
  }

  return Promise
    .resolve()
    .then(scroll3Times)
    .then(getInviteBtnThenClick);
}


function calculateTime(start, end) {
  return (end - start)/1000;
}


// --------------------------------------
// Main function
// --------------------------------------

async function main() {

  console.log(
    `Start connecting user LinkedIn, on: ${new Date().toString()}`
  );

  const browser = await puppeteer.launch({
    headless: dev ? false : true,
  });

  try {
    const page = await browser.newPage();
    
    console.log('Go to linkedin.');
    await page.goto('https://www.linkedin.com/');


    console.log('Login linkedin.');
    const usernameSelector = '#login-email';
    const passwordSelector = '#login-password';
    await page.type(usernameSelector, USER_NAME);
    await page.type(passwordSelector, PASSWORD);
    await page.click('#login-submit');

    console.log('Click network tab.');
    const networkTabSelector = '#mynetwork-tab-icon';
    await page.waitForSelector(networkTabSelector);
    await page.click(networkTabSelector);
   
    const connectButtonSelector = '.button-secondary-small';

    const startTime = Date.now();
    console.log('Start clicking [Connect] buttons ...');

    for (let i = 0; i < ITERATION; i++) {
      const startBlock = Date.now();

      await page.waitForSelector(connectButtonSelector);
      await page.evaluate(invite)
      await page.reload(invite)

      const endBlock = Date.now();
      console.log(`Loop: ${i + 1}/${ITERATION} - last: ${calculateTime(startBlock, endBlock)}s`)
    }

    const endTime = Date.now();
    console.log('Total time: ' + calculateTime(startTime, endTime) +'s') 
    console.log('Done!');
    await browser.close();
  } catch(error) {
    console.error(error);
    await browser.close();
  }
}

main();
