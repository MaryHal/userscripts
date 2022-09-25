// ==UserScript==
// @name         Fight Reward Logger
// @namespace    http://tampermonkey.net/
// @version      0.3.7
// @description
// @author       You
// @match        http://www.carnageblender.com/fight.tcl*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=carnageblender.com
// @downloadURL  https://github.com/MaryHal/userscripts/raw/master/cb2_FightRewardLogger.js
// @updateURL    https://github.com/MaryHal/userscripts/raw/master/cb2_FightRewardLogger.js
// ==/UserScript==

(function () {
  "use strict";

  function rewardKey(opponentId) {
    return `rewards-${opponentId}`;
  }

  function cleanNumber(n) {
    return Number(n.replaceAll("$", "").replaceAll(",", ""));
  }

  function loadRewardData(opponentId) {
    const rewardData = localStorage.getItem(rewardKey(opponentId));
    if (rewardData) {
      return JSON.parse(rewardData);
    }

    return {
      exp: [],
      cash: [],
      lastCash: null,
    };
  }

  function saveRewardData(opponentId, data = {}) {
    localStorage.setItem(rewardKey(opponentId), JSON.stringify(data));
  }

  function removeRewardData(opponentId) {
    localStorage.removeItem(rewardKey(opponentId));
  }

  function getRewardsStats(dataArray) {
    const average = dataArray.reduce((v, acc) => v + acc, 0) / dataArray.length;
    return {
      count: dataArray.length,
      average,
      min: Math.min(...dataArray),
      max: Math.max(...dataArray),
    };
  }

  function showData(elementToAddTo, data) {
    const expData = getRewardsStats(data.exp);
    const cashData = getRewardsStats(data.cash);

    const cashDataElement = window.document.createElement("input");
    cashDataElement.setAttribute("readonly", "true");
    cashDataElement.style.width = "100%";
    cashDataElement.value = data.cash.join(" ");
    elementToAddTo.prepend(cashDataElement);

    const cashStatsElement = window.document.createElement("p");
    cashStatsElement.innerText = `$CB (${cashData.count}): Average ${cashData.average}, Min ${cashData.min}, Max ${cashData.max}`;
    elementToAddTo.prepend(cashStatsElement);

    const expDataElement = window.document.createElement("input");
    expDataElement.setAttribute("readonly", "true");
    expDataElement.style.width = "100%";
    expDataElement.value = data.exp.join(" ");
    elementToAddTo.prepend(expDataElement);

    const expStatsElement = window.document.createElement("p");
    expStatsElement.innerText = `EXP (${expData.count}): Average ${expData.average}, Min ${expData.min}, Max ${expData.max}`;
    elementToAddTo.prepend(expStatsElement);

    const resetButton = window.document.createElement("button");
    resetButton.innerText = "Reset";
    resetButton.addEventListener(
      "click",
      function () {
        removeRewardData(opponentId);
        removeRewardData(opponentId);
      },
      false
    );
    elementToAddTo.prepend(resetButton);

    const resetAllButton = window.document.createElement("button");
    resetAllButton.innerText = "Reset All";
    resetAllButton.addEventListener(
      "click",
      function () {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith("rewards-")) {
            localStorage.removeItem(key);
            i--;
          }
        }
      },
      false
    );
    elementToAddTo.prepend(resetAllButton);
  }

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const idFromLink = document
    .querySelector(
      "body > table:nth-child(4) > tbody > tr > td > table:nth-child(1) > tbody > tr.header-font > td > a:nth-child(1)"
    )
    ?.getAttribute("href")
    ?.match(/(\d+)$/)[0];

  const opponentId = params.opponent_id || idFromLink;

  if (!opponentId) {
    console.debug("Not running on the fight page.");
    return;
  }

  const cashReward = window.document.querySelector(
    "body > table:nth-child(4) > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2)"
  );
  const expReward = window.document.querySelector(
    "body > table:nth-child(4) > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(4) > td:nth-child(2)"
  );
  const currentCash = window.document
    .querySelector(
      "body > table:nth-child(4) > tbody > tr > td > table:nth-child(1) > tbody > tr:nth-child(3) > td"
    )
    ?.innerText?.match(/You have \$([\d,]+)./)?.[1];

  const rewardData = loadRewardData(opponentId);

  const body = window.document.getElementsByTagName("body")[0];

  if (cashReward && expReward && currentCash) {
    const currentCashNumber = cleanNumber(currentCash);

    if (
      rewardData.lastCash == null ||
      currentCashNumber > rewardData.lastCash
    ) {
      rewardData.exp.push(cleanNumber(expReward.innerText));
      rewardData.cash.push(cleanNumber(cashReward.innerText));

      rewardData.lastCash = currentCashNumber;

      saveRewardData(opponentId, rewardData);
    }
  }

  showData(body, rewardData);
})();
