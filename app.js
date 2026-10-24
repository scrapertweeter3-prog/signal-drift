/* Signal Drift UI wiring. */
var LEVELS = [
  {name: "Rumor", blurb: "6% suspected contamination, incident cost $200"},
  {name: "Benchmark chatter", blurb: "11% suspected contamination, incident cost $350"},
  {name: "Known leak", blurb: "18% suspected contamination, incident cost $600"}
];
var APPROACHES = [
  {name: "Trust the set", blurb: "$0 audit, ships with every bad row in place"},
  {name: "Entropy lens", blurb: "$1 per row read, catches most bad rows, some clean flags"},
  {name: "Full sweep", blurb: "$4 per row read, catches about 9 in 10 bad rows"}
];

var chosenLevel = null;
var audited = false;

function renderLevels() {
  var box = document.getElementById("levels");
  box.innerHTML = "";
  LEVELS.forEach(function (lv, i) {
    var d = document.createElement("div");
    d.className = "card";
    d.innerHTML = "<b>" + lv.name + "</b><span>" + lv.blurb + "</span>";
    d.onclick = function () {
      chosenLevel = i;
      [...box.children].forEach(function (c) { c.classList.remove("sel"); });
      d.classList.add("sel");
      document.getElementById("levelname").textContent = lv.name;
      document.getElementById("levelNext").disabled = false;
    };
    box.appendChild(d);
  });
}

function renderApproaches() {
  var box = document.getElementById("approaches");
  box.innerHTML = "";
  APPROACHES.forEach(function (ap, i) {
    var d = document.createElement("div");
    d.className = "card";
    d.innerHTML = "<b>" + ap.name + "</b><span>" + ap.blurb + "</span>";
    d.onclick = function () {
      audited = false;
      [...box.children].forEach(function (c) { c.classList.remove("sel"); });
      d.classList.add("sel");
      document.getElementById("runAudit").disabled = false;
    };
    box.appendChild(d);
  });
}

renderLevels();
renderApproaches();

document.getElementById("levelNext").onclick = function () {
  document.getElementById("m0").style.display = "none";
  document.getElementById("m1").style.display = "block";
  SignalDrift.start(chosenLevel);
};

document.getElementById("runAudit").onclick = function () {
  var idx = [...document.getElementById("approaches").children].findIndex(function (c) {
    return c.classList.contains("sel");
  });
  var res = SignalDrift.pickApproach(idx);
  audited = true;
  document.getElementById("report").innerHTML =
    "<div class='kv'>Approach: " + res.approach + "</div>" +
    "<div class='kv'>Rows flagged for rewrite: " + res.flagged + " of 400</div>" +
    "<div class='kv'>Audit cost: $" + res.auditCost.toFixed(2) + "</div>" +
    "<div class='kv'>Rewrites bill $8 each, clean or contaminated.</div>";
  document.getElementById("fixnote").textContent = "";
};

document.getElementById("fixAll").onclick = function () {
  if (!audited) { return; }
  var r = SignalDrift.fixAll();
  document.getElementById("fixnote").textContent = r.log[r.log.length - 1] + ".";
};

document.getElementById("ship").onclick = function () {
  if (!audited) { return; }
  var s = SignalDrift.ship();
  document.getElementById("m2").style.display = "none";
  document.getElementById("m3").style.display = "block";
  var rows = "<tr><th>Stage</th><th>Cost</th></tr>" +
    "<tr><td>Contamination incident exposure</td><td>$" + s.level.cost.toFixed(2) + "</td></tr>" +
    "<tr><td>Audit (" + s.approach.name + ", 400 rows)</td><td>$" + s.auditCost.toFixed(2) + "</td></tr>" +
    "<tr><td>Rewrites at $8</td><td>$" + s.fixCost.toFixed(2) + "</td></tr>" +
    "<tr><td><b>Total spend</b></td><td><b>$" + s.totalCost.toFixed(2) + "</b></td></tr>" +
    "<tr><td>Contaminated rows shipped</td><td>" + s.badLeft + " of 400</td></tr>" +
    "<tr><td>Clean points kept</td><td>" + s.cleanPoints + "</td></tr>" +
    "<tr><td>Cost per clean point</td><td>$" + s.cpp.toFixed(3) + "</td></tr>";
  document.getElementById("board").innerHTML = rows;
  document.getElementById("verdict").textContent = SignalDrift.verdictLine();
  var lesson = s.badLeft > 0
    ? "Every bad row left in the set quietly re-rates the model. The sweep costs more per row and still misses about one in ten."
    : "Blind trust would have shipped the incident for free and paid for it in the metric. Fixing flagged rows runs $8 a rewrite.";
  document.getElementById("lesson").textContent = lesson;
};

document.getElementById("again").onclick = function () {
  document.getElementById("m3").style.display = "none";
  document.getElementById("m1").style.display = "none";
  document.getElementById("m0").style.display = "block";
  audited = false;
};
