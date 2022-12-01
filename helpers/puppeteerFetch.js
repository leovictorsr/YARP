const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const convertCookieStringToJSON = (string, domain) => {
  let cookieString = string.split(";");
  let cookieObject = []
  cookieString.map(s => {
    let [key, value] = s.split("=");
    cookieObject.push({name: key, value, domain});
  });

  return JSON.stringify(cookieObject)
}

const cookieString = "g1t=1669898821027; basketful_s=db7435cf-9a81-4469-95c6-04a61478ee91; OptanonConsent=isGpcEnabled=1&datestamp=Thu+Dec+01+2022+10%3A11%3A26+GMT-0300+(Hor%C3%A1rio+Padr%C3%A3o+de+Bras%C3%ADlia)&version=202208.1.0&hosts=&groups=C0001%3A1%2CC0003%3A0%2CC0002%3A0%2CC0005%3A0%2CC0007%3A0%2CC0004%3A0; yv=yDh48bOCnTOZwAGbsP5j9; r_ab_state=%7B%22post-signup-upsell%22%3A%22variant-1%22%2C%22paywall-modal-variant-contextual-generic%22%3A%22default%22%2C%22main-navigation%22%3A%22default%22%7D; SameSite=None; Secure=true; basketful_u=57a77600-fdba-42df-9496-9421991fa310_424aff5fd4f7c7048b4598cf3358900f92f72a3ccc11933a7a74389c25a537a9" 

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
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  ];
  const options = {
    args,
    headless: true,
    ignoreHTTPSErrors: true,
    userDataDir: './tmp'
  };
  
  const browser = await puppeteer.launch(options);

  const page = (await browser.pages())[0];
  
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

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
  })
  
  // Pass the Permissions Test.
  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query;
    return window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  // Pass the Plugins Length Test.
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'plugins', {
      // This just needs to have `length > 0` for the current test,
      // but we could mock the plugins too if necessary.
      get: () => [1, 2, 3, 4, 5],
    });
  }); 

  // Pass the Languages Test.
  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  const domain = "https://" + url.split("/")[2];
  await page.setCookie({name: 'Secure', value: 'true', domain});

  const response = await page.goto(url);
  console.log(response);

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
