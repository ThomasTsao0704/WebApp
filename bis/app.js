// BIS 預設查詢範本
// 對應 BIS WS_NA_SEC_DSS 的維度順序
const TEMPLATE =
  "A.N.TW.XW.S13.S1.N.L.LE.F3.L._Z.USD.X1+XDC.N.V.N._T"
  .split(".");

let DIMS = [];
let chart = null;

const $ = id => document.getElementById(id);

// ======================================================
// Google Apps Script Web App
// ======================================================
// 部署 Code.gs 後取得 /exec URL
// GitHub Pages 會透過 JSONP 呼叫 GAS
// ======================================================

const GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbzvmobA1LOrqANcF1cX8ioTHuW5c-BCyUxQDBVDZbbC0eYg33MTwt3bDkvL0hzF30Ju8Q/exec";


// ======================================================
// GAS JSONP
// ======================================================

function gasJsonp(action, params = {}) {

  return new Promise((resolve, reject) => {

    const cb =
      "gas_cb_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2);

    const script =
      document.createElement("script");

    const q =
      new URLSearchParams({
        action,
        callback: cb,
        ...params
      });

    const timer =
      setTimeout(() => {

        cleanup();

        reject(
          new Error("GAS API 逾時")
        );

      }, 60000);


    function cleanup() {

      clearTimeout(timer);

      delete window[cb];

      script.remove();
    }


    window[cb] = data => {

      cleanup();

      resolve(data);
    };


    script.onerror = () => {

      cleanup();

      reject(
        new Error("GAS API 無法連線")
      );
    };


    script.src =
      GAS_API_URL +
      (
        GAS_API_URL.includes("?")
          ? "&"
          : "?"
      ) +
      q.toString();


    document.head.appendChild(script);
  });
}
