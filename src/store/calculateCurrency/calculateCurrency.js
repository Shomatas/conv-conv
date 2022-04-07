import {defaultState} from "../state.js";
import render from '../../render.js';
import {store} from '../store.js';

const action = {type: "", payload: "?"}
let quotes;

fetch('https://www.cbr-xml-daily.ru/daily_utf8.xml')
.then(data => data.text())
.then(data => {
  console.log(data);
  let pos = data.indexOf('Доллар США');
  pos = data.indexOf('<Value>', pos) + 7;
  console.log(data[pos]);
  let endpos = data.indexOf('</Value>', pos);
  console.log(endpos);
  console.log(data.substring(pos, endpos));

  let u = data.substring(pos, endpos);
  u = Number(u.split(',')[0] + '.' + u.split(',')[1]);

  pos = data.indexOf('Евро');
  pos = data.indexOf('<Value>', pos) + 7;
  endpos = data.indexOf('</Value>', pos);

  let e = data.substring(pos, endpos);
  e = Number(e.split(',')[0] + '.' + e.split(',')[1]);
  console.log(e);

  quotes = new Map();
  let usd = new Map();
  usd.set('RUB', 1.0 / u);
  usd.set('USD', 1.0);
  usd.set('EU', u / e);

  let rub = new Map();
  rub.set('RUB', 1.0);
  rub.set('USD', u);
  rub.set('EU', e);

  let eu = new Map();
  eu.set('RUB', 1 / e);
  eu.set('USD', e / u);
  eu.set('EU', 1.0);

  quotes.set('RUB', rub);
  quotes.set('USD', usd);
  quotes.set('EU', eu);

  defaultState.quotes = quotes;
  render(store);
});

export const calculateCurrency = (state = defaultState, action) => {
  switch (action.type) {
    case "CALCULATE_CURRENCY":
      if(isNaN(Number(action.payload))){
        return state;
      }
      let k = quotes.get(state.inputCur.default).get(state.outputCur.default);
      let tempCur = state.outputCur;
      tempCur.value = action.payload * k;
      let inpTempCur = state.inputCur;
      if(inpTempCur.value == 0) inpTempCur.value = Number(action.payload);
      else inpTempCur.value = action.payload;
      render();
      return {...state, inputCur: inpTempCur, outputCur: tempCur};
    case "REVERSE_CURRENCY":
      let outTempCur1 = state.inputCur;
      let inpTempCur1 = state.outputCur;
      return {...state, inputCur: Object.assign({}, inpTempCur1), outputCur: Object.assign({}, outTempCur1)};

    case "CHANGE_CURRENCY_OUTPUT":
      let val = Object.assign({}, state.outputCur);
      val.default = action.payload;
      let g = quotes.get(state.inputCur.default).get(val.default);
      val.value = Number(state.inputCur.value) * g;
      return {...state, outputCur: val};

    case "CHANGE_CURRENCY_INPUT":
      let inpSelect = Object.assign({}, state.inputCur);
      inpSelect.default = action.payload;
      let d = quotes.get(inpSelect.default).get(state.outputCur.default);
      let outSelect1 = state.outputCur;
      state.outputCur.value = Number(state.inputCur.value) * d;
      render();
      return {...state, inputCur: Object.assign({}, inpSelect)};
    default:
      return state;
  }
}
