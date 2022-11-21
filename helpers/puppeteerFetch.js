const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
puppeteer.use(StealthPlugin());

const blockedResourceTypes = [
  "image",
  "media",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "imageset",
  "stylesheet",
  "font"
];

const skippedResources = [
  "quantserve",
  "adzerk",
  "doubleclick",
  "adition",
  "exelator",
  "sharethrough",
  "cdn.api.twitter",
  "google-analytics",
  "googletagmanager",
  "google",
  "fontawesome",
  "facebook",
  "analytics",
  "optimizely",
  "clicktale",
  "mixpanel",
  "zedo",
  "clicksor",
  "tiqcdn"
];

const puppeteerFetch = async url => {
  const userAgent = randomUseragent.getRandom();
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    `--user-agent=${userAgent}`
  ];
  const options = {
    args,
    headless: false,
    ignoreHTTPSErrors: true,
    userDataDir: './tmp'
  };
  
  const browser = await puppeteer.launch(options);

  const page = (await browser.pages())[0];
  await page.setRequestInterception(true);

  await page.on("request", req => {
    const requestUrl = req._url.split("?")[0].split("#")[0];
    if (
      blockedResourceTypes.indexOf(req.resourceType()) !== -1 ||
      skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const response = await page.goto(url);

  console.log(response)

  if (response._status < 400) {
    let html = await page.content();
    try {
      await browser.close();
    } finally {
      return html;
    } // avoid websocket error if browser already closed
  } else {
    try {
      await browser.close();
    } finally {
      return Promise.reject(response._status);
    }
  }
};

module.exports = puppeteerFetch;
