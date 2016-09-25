//require('babel-polyfill');
import { STORAGE_PRS_KEY, STORAGE_TOKEN, CACHE_TTL } from './constants';
import { makePRRequests, findPR, renderLabels } from './util';

// setup
const token = localStorage.getItem(STORAGE_TOKEN);
const repo = (window.location.href.split('github.com/'))[1].replace(/\/pulls/, '');

// check our storage for cached pulls
// cache shape: { items: [], lastUpdated: new Date().getTime() }
let prs = JSON.parse(localStorage.getItem(STORAGE_PRS_KEY) || '{}');
!prs.items && (prs.items = []);
console.log(repo, STORAGE_PRS_KEY, prs);

// get some dom elements we'll need to compare against our storage
const prsContainerEl = document.querySelector('.js-active-navigation-container');
const prAnchorEls = prsContainerEl.querySelectorAll('a.h4');

// compare dom with cache, if found, and not expired, use
// otherwise we need to add it or update our cache and
// request new items from api
prAnchorEls.forEach((item, key) => {
  const parts = item.href.split('/pull/');
  if (!findPR(prs.items, parts[1])) {

    console.log('------------------------------------------------');
    console.log(parts[1], findPR(prs.items, parts[1]));
    console.log((new Date().getTime()))
    console.log(item.expiry);
    console.log('not found');

    prs.items.push({
      pr: parts[1],
      expiry: (new Date().getTime()) + CACHE_TTL,
      status: '',
    });
  } else if ((new Date().getTime()) > item.expiry) {

    console.log('------------------------------------------------');
    console.log(parts[1], findPR(prs.items, parts[1]));
    console.log((new Date().getTime()))
    console.log(item.expiry);
    console.log('found but expired?');

    prs.items.splice(key, 1, Object.assign(item, {
      expiry: (new Date().getTime()) + CACHE_TTL,
      status: '',
    }));
  }
});

console.log(repo, STORAGE_PRS_KEY, prs);

// once all outbound requests have finished (if any), update our cached data
Promise.all(makePRRequests(repo, prs, token))
  .then(() => {
    prs.updatedAt = new Date().getTime();
    console.log(prs);
    localStorage.setItem(STORAGE_PRS_KEY, JSON.stringify(prs));
    return prs.items;
  })
  .then((items) => renderLabels(prsContainerEl, items))
  .catch((e) => {
    console.warn(e);
    if (!token) {
      const t = prompt('Private repos require a personal access token. You can set this up under: Settings > Personal access tokens > Generate New');

      if (t) {
        localStorage.setItem(STORAGE_TOKEN, t);

        Promise.all(makePRRequests(repo, prs, t))
          .then((items) => renderLabels(prsContainerEl, items));
      }
    } else {
      alert('There was an issue accessing the repo.');
    }
  });


// @todo - when open an individual PR, track the status there and store it
