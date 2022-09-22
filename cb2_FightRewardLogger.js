// ==UserScript==
// @name         Fight Reward Logger
// @namespace    http://tampermonkey.net/
// @version      0.2.8
// @description
// @author       You
// @match        http://www.carnageblender.com/fight.tcl*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=carnageblender.com
// ==/UserScript==

(function () {
  "use strict";

  const REWARD_LOG_DELMITER = ",";
  const RewardType = {
    CASH: "cash",
    EXP: "exp",
  };

  function rewardKey(opponentId, rewardType) {
    return `rewards-${opponentId}-${rewardType}`;
  }

  function cleanNumber(n) {
    return Number(n.replace("$", "").replace(",", ""));
  }

  function loadRewardData(opponentId, rewardType) {
    const rewardData = localStorage.getItem(rewardKey(opponentId, rewardType));
    if (rewardData) {
      return rewardData.split(REWARD_LOG_DELMITER).map((d) => Number(d));
    }

    return [];
  }

  function saveRewardData(opponentId, rewardType, dataArray) {
    if (!dataArray) {
      dataArray = [];
    }

    localStorage.setItem(
      rewardKey(opponentId, rewardType),
      dataArray.join(REWARD_LOG_DELMITER)
    );
  }

  function showData(elementToAddTo, expData, cashData) {
    const expAverage = expData.reduce((v, acc) => v + acc, 0) / expData.length;
    const cashAverage =
      cashData.reduce((v, acc) => v + acc, 0) / cashData.length;

    const cashDataElement = window.document.createElement("input");
    cashDataElement.setAttribute("readonly", "true");
    cashDataElement.style.width = "100%";
    cashDataElement.value = cashData.join(" ");
    elementToAddTo.prepend(cashDataElement);

    const averageCashElement = window.document.createElement("p");
    averageCashElement.innerText = `Average $CB (${cashData.length}): ${cashAverage}`;
    elementToAddTo.prepend(averageCashElement);

    const expDataElement = window.document.createElement("input");
    expDataElement.setAttribute("readonly", "true");
    expDataElement.style.width = "100%";
    expDataElement.value = expData.join(" ");
    elementToAddTo.prepend(expDataElement);

    const averageExpElement = window.document.createElement("p");
    averageExpElement.innerText = `Average EXP (${expData.length}): ${expAverage}`;
    elementToAddTo.prepend(averageExpElement);

    const resetButton = window.document.createElement("button");
    resetButton.innerText = "Reset";
    resetButton.addEventListener(
      "click",
      function () {
        saveRewardData(opponentId, RewardType.EXP, []);
        saveRewardData(opponentId, RewardType.CASH, []);
      },
      false
    );
    elementToAddTo.prepend(resetButton);
  }

  //window.addEventListener('load', function() {

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

  const expData = loadRewardData(opponentId, RewardType.EXP);
  const cashData = loadRewardData(opponentId, RewardType.CASH);

  const body = window.document.getElementsByTagName("body")[0];

  if (cashReward && expReward) {
    expData.push(cleanNumber(expReward.innerText));
    cashData.push(cleanNumber(cashReward.innerText));

    saveRewardData(opponentId, RewardType.EXP, expData);
    saveRewardData(opponentId, RewardType.CASH, cashData);
  }

  showData(body, expData, cashData);

  //}, false);
})();
