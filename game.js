/* Signal Drift: audit a suspect eval set before shipping; lowest cost per clean point wins. */
var LEVELS = [
  {name: "Rumor", rate: 0.06, cost: 200},
  {name: "Benchmark chatter", rate: 0.11, cost: 350},
  {name: "Known leak", rate: 0.18, cost: 600}
];

var APPROACHES = [
  {name: "Trust the set", blind: true, recall: 0.0, falsePos: 0.0, costPerRow: 0},
  {name: "Entropy lens", blind: false, recall: 0.62, falsePos: 0.05, costPerRow: 1},
  {name: "Full sweep", blind: false, recall: 0.9, falsePos: 0.02, costPerRow: 4}
];

var FIX_COST = 8;
var N = 400;
var state = null;

function start(levelIdx, rng) {
  rng = rng || Math.random;
  var level = LEVELS[levelIdx];
  var bad = [];
  for (var i = 0; i < N; i += 1) {
    bad.push(rng() < level.rate);
  }
  state = {
    level: level, rng: rng, bad: bad, approach: null,
    flags: [], over: false,
    auditCost: 0, fixCost: 0, shippedBlind: false,
    log: []
  };
  return state;
}

function pickApproach(idx) {
  state.approach = APPROACHES[idx];
  state.auditCost = state.approach.costPerRow * N;
  state.flags = [];
  for (var i = 0; i < N; i += 1) {
    var isBad = state.bad[i];
    var hit = false;
    if (state.approach.blind) {
      hit = false;
    } else if (isBad) {
      hit = state.rng() < state.approach.recall;
    } else {
      hit = state.rng() < state.approach.falsePos;
    }
    if (hit) { state.flags.push(i); }
  }
  return {
    approach: state.approach.name,
    auditCost: state.auditCost,
    flagged: state.flags.length
  };
}

/* fixAll: rewrite every flagged row. Real bad rows fixed cost $8; false
   positives cost $8 and burn review trust (tracking only). */
function fixAll() {
  var realBad = 0, wasted = 0;
  for (var i = 0; i < state.flags.length; i += 1) {
    var idx = state.flags[i];
    state.fixCost += FIX_COST;
    if (state.bad[idx]) { realBad += 1; } else { wasted += 1; }
  }
  state.fixedReal = realBad;
  state.fixedWasted = wasted;
  state.log.push("rewrote " + state.flags.length + " flagged rows: " + realBad +
                 " contaminated, " + wasted + " clean");
  return state;
}

function ship() {
  var badLeft = 0;
  for (var i = 0; i < N; i += 1) {
    if (state.bad[i] && state.flags.indexOf(i) === -1) { badLeft += 1; }
  }
  state.badLeft = badLeft;
  state.over = true;
  state.totalCost = state.level.cost + state.auditCost + state.fixCost;
  state.cleanPoints = N - badLeft;
  state.cpp = (badLeft === 0) ? (state.totalCost / N)
                              : (state.totalCost / (N - badLeft));
  return state;
}

function verdictLine() {
  if (!state.over) { return ""; }
  if (state.badLeft === 0) { return "Set ships clean."; }
  return "Shipped with " + state.badLeft + " contaminated rows in the set.";
}

function getState() { return state; }

if (typeof module !== "undefined" && module.exports) {
  module.exports = {LEVELS: LEVELS, APPROACHES: APPROACHES, N: N,
                    FIX_COST: FIX_COST, start: start, pickApproach: pickApproach,
                    fixAll: fixAll, ship: ship, verdictLine: verdictLine,
                    getState: getState};
} else {
  window.SignalDrift = {start: start, pickApproach: pickApproach,
                        fixAll: fixAll, ship: ship, verdictLine: verdictLine,
                        getState: getState};
}
