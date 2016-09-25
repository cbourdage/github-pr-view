import { CACHE_TTL } from './constants';

/**
 * Fetches a url with opts
 * @param {String} url
 * @param {Object} opts
 * @return {Promise.<TResult>}
 */
function makeRequest(url, opts = { token: null }) {
  let fopts = { headers: {} };

  if (opts.token) {
    fopts.headers = Object.assign(fopts.headers, {
      Authorization: 'token ' + opts.token, // api Authoriztaion
      Accept: 'application/vnd.github.inertia-preview+json',
    });
  }

  return fetch(url, fopts)
    .then(validateResponse)
    .then((res) => res.text())
    //.then((res) => res.json())
    .catch(handleError);
}

/**
 * Handles any error from fetch
 * @param {Object} r
 */
function validateResponse(r) {
  if (r.status >= 200 && r.status < 300) {
    return r;
  }
  throw new Error(r.statusText);
}

/**
 * Handles any error from fetch
 * @param {Error} e
 */
function handleError(e) {
  console.warn(e);
  throw e;
}

/**
 * Makes all of our requests for any items that we
 * don't have a status for that we need to update
 * @param {String} repo
 * @param {Object} prs
 * @return {Array}
 */
export function makePRRequests(repo, prs, token) {
  const requests = [];
  prs.items.forEach((item, key) => {
    if (!item.status && key < 2) {
      console.log('requesting for: ', item);

      requests.push(
        //makeRequest(`https://api.github.com/repos/${repo}/pulls/1045`, { token })
        makeRequest(`https://github.com/${repo}/pull/${item.pr}`, { token: token })
          .then((res) => {
            console.log(res);

            if (/<h4 class="status-heading  ">(.*)Changes approved(.*)<\/h4>/.test(res)) {
              console.log('approved');
            } else if (/<h4 class="status-heading text-red ">(.*)Changes requested(.*)<\/h4>/.test(res)) {
              console.log('requested');
            }

            item = Object.assign(item, {
              expiry: (new Date().getTime()) + CACHE_TTL,
              //status: 'approved',
            });
          })
      );
    }
  });

  return requests;
}

/**
 * Finds a PR object within a list of PRs
 * @param list
 * @param pr
 * @return {Object}
 */
export function findPR(list, pr) {
  return list.find((item) => pr === item.pr);
}


/**
 * Renders the labels for us
 * @param {Array} items
 */
export function renderLabels(prsContainerEl, items) {
  // Add our labels to our view
  prsContainerEl.querySelectorAll('a.h4').forEach((item) => {
    const parts = item.href.split('/pull/');
    const pr = findPR(items, parts[1]);

    if (pr.status) {
      const label = document.createElement('a');
      const sharedCn = 'label v-align-text-top';

      switch (pr.status) {
        case 'approved':
          label.className = `${sharedCn} labelstyle-bd2c00 linked-labelstyle-bd2c00`;
          label.style = 'background-color: #bd2c00; color: #fff;';
          label.innerText = 'Changes Approved';
        case 'changes_requested':
          label.className = `${sharedCn} labelstyle-6cc644 linked-labelstyle-6cc644`;
          label.style = 'background-color: #6cc644; color: #fff;';
          label.innerText = 'Changes Requested';
        default:
          break;
      }

      item.nextElementSibling.appendChild(label);
    }
  });
}
