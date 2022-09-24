// ==UserScript==
// @name         Fight Reward Logger
// @namespace    http://tampermonkey.net/
// @version      0.3.4
// @description
// @author       You
// @match        http://www.carnageblender.com/fight.tcl*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=carnageblender.com
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

  function showData(elementToAddTo, data) {
    const expAverage =
      data.exp.reduce((v, acc) => v + acc, 0) / data.exp.length;
    const cashAverage =
      data.cash.reduce((v, acc) => v + acc, 0) / data.cash.length;

    const cashDataElement = window.document.createElement("input");
    cashDataElement.setAttribute("readonly", "true");
    cashDataElement.style.width = "100%";
    cashDataElement.value = data.cash.join(" ");
    elementToAddTo.prepend(cashDataElement);

    const averageCashElement = window.document.createElement("p");
    averageCashElement.innerText = `Average $CB (${data.cash.length}): ${cashAverage}`;
    elementToAddTo.prepend(averageCashElement);

    const expDataElement = window.document.createElement("input");
    expDataElement.setAttribute("readonly", "true");
    expDataElement.style.width = "100%";
    expDataElement.value = data.exp.join(" ");
    elementToAddTo.prepend(expDataElement);

    const averageExpElement = window.document.createElement("p");
    averageExpElement.innerText = `Average EXP (${data.exp.length}): ${expAverage}`;
    elementToAddTo.prepend(averageExpElement);

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
    console.log("This is not running on the right page!");
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
    console.log(currentCash);
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
