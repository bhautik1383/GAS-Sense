export const INFO = {
  cylinder: ['LPG Cylinder', 'Holds the LPG. Its total weight (steel plus gas) is what the base would measure.', 'Rests on the upper weighing platform.', 'Upper weighing platform'],
  plate: ['Upper Weighing Platform', 'Carries the cylinder and passes its weight down to the load cells.', 'Top layer of the smart base.', 'Load cell assembly'],
  loadcell: ['Load Cell Assembly', 'Four conceptual supports whose strain changes with the supported weight.', 'Between the upper platform and the lower enclosure.', 'HX711 amplifier'],
  hx711: ['HX711 Amplifier', 'Amplifies and digitizes the very small load-cell signal.', 'Inside the lower enclosure, next to the load cells.', 'ESP32 controller'],
  esp32: ['ESP32 Controller', 'Receives the digital measurement, converts weight to a gas percentage and, in a real build, would send it over Wi-Fi.', 'Inside the lower enclosure.', 'Wi-Fi link to the dashboard'],
  wifi: ['Wi-Fi Antenna', 'Carries readings from the ESP32 to the backend and the dashboard.', 'Radio section of the ESP32.', 'Backend and monitoring dashboard'],
  power: ['Power Module', 'Gives regulated power to the ESP32 and HX711 from the USB/DC input.', 'Inside the enclosure, near the power port.', 'ESP32 and HX711'],
  enclosure: ['Protective Lower Enclosure', 'Graphite housing that protects the electronics and carries the load.', 'Bottom layer of the smart base.', 'Kitchen floor'],
  led: ['Status LED', 'Shows green, amber or red status and the Wi-Fi state on the base itself.', 'Front face of the enclosure.', 'The user, at a glance'],
};
export const STAGES = [
  ['LPG Cylinder on Weighing Base', 'Cylinder weight', 'Weight presses on the platform', 'Force on the load cells', 'Mechanical', 'Source of the quantity to be measured'],
  ['Load Cell', 'Force from the platform', 'Strain changes a tiny electrical signal', 'Analog millivolt signal', 'Wired', 'Turns weight into an electrical signal'],
  ['HX711 Amplifier', 'Analog load-cell signal', 'Amplifies and converts to digital', 'Digital weight value', 'Wired (2 data lines)', 'Makes the signal readable by a microcontroller'],
  ['ESP32 Controller', 'Digital weight value', 'Subtracts tare weight, converts to gas %', 'Percentage and status', 'Wi-Fi built in', 'Brain of the device'],
  ['Wi-Fi Connection', 'Percentage and status', 'Packs and sends readings', 'Network message', 'Wi-Fi / HTTP', 'Carries data to the cloud'],
  ['Backend / Data Service', 'Network message', 'Stores readings, checks thresholds', 'Stored history and alerts', 'Internet', 'Memory and decision logic (proposed)'],
  ['GasSense Dashboard', 'Stored readings', 'Shows level, mass, days left, trend', 'Screens for the user', 'Web / mobile', 'Where the user sees the result'],
  ['Low-Gas Alert and Refill Planning', 'Gas status', 'Compares with 30% and 10% limits', 'Alert and refill advice', 'Push / SMS', 'Helps the user refill before gas runs out'],
];
export const DOCS = [
  ['Problem statement', 'Households cannot tell how much LPG is left in a cylinder, so gas often ends suddenly during cooking and users guess by shaking or lifting the cylinder, which is unreliable and unsafe.'],
  ['Objectives', 'Show remaining gas at a glance, warn early, support refill planning, and work as a retrofit with the cylinder a family already owns.'],
  ['Proposed solution', 'A smart weighing base under the cylinder measures total weight. The estimated gas is the measured weight minus the empty-cylinder (tare) weight.'],
  ['Hardware components', 'Load cell assembly, HX711 amplifier, ESP32 controller, Wi-Fi, power module, status LED, graphite enclosure and upper weighing platform.'],
  ['Software architecture', 'ESP32 firmware reads the HX711, calculates the percentage and sends it to a backend. A dashboard shows level, mass, days left, trend and alerts.'],
  ['Operating principle', 'Gas percentage = (measured weight - tare) / LPG capacity x 100. Thresholds: Low Gas at 30% or below, Critical at 10% or below.'],
  ['Benefits', 'No guessing, early refill planning, works with existing cylinders, alerts through app, SMS and LED.'],
  ['Limitations', 'Hardware is not built, calibrated or tested. All numbers here are simulated. Tare weight differs between cylinders, and the sensor measures weight, not the gas inside.'],
  ['Future improvements', 'Real load-cell calibration, agency booking API, leak detection from a fast weight drop, multi-cylinder tracking and a distributor dashboard.'],
];
export const STEPS = [
  { page: 'overview', mode: 'product', level: 100, sel: null, title: 'Opening', say: 'Our project is GasSense, a smart weighing base that tells a household how much LPG is left. This is a virtual prototype: the hardware is not built.' },
  { page: 'studio', mode: 'product', level: 100, sel: null, title: 'Product overview', say: 'The cylinder sits on a graphite smart base with a status LED, power port and Wi-Fi indicator. Rotate and zoom to inspect it.' },
  { page: 'studio', mode: 'internal', level: 100, sel: 'loadcell', title: 'Inside the base', say: 'With the cylinder and plate hidden you can see the load cells, HX711, ESP32 and power module inside the enclosure.' },
  { page: 'studio', mode: 'exploded', level: 100, sel: null, title: 'Exploded assembly', say: 'The exploded view shows every layer in order: cylinder, platform, load cells, electronics and enclosure, with the signal wiring.' },
  { page: 'studio', mode: 'exploded', level: 100, sel: 'esp32', title: 'Component explained', say: 'The ESP32 receives the digitized weight, converts it to a percentage and would send it over Wi-Fi in a real build.' },
  { page: 'architecture', mode: 'product', level: 100, sel: null, title: 'System architecture', say: 'Weight goes load cell, HX711, ESP32, Wi-Fi, backend, dashboard and alert. Only the concept is proposed, nothing is implemented yet.' },
  { page: 'lab', mode: 'product', level: 65, sel: null, title: 'Gas level demo', say: 'At 65 percent the status is Normal. Mass, days left and total weight are calculated from simulated assumptions.' },
  { page: 'lab', mode: 'product', level: 25, sel: null, title: 'Low gas alert', say: 'At 30 percent or below the status becomes Low Gas and the dashboard recommends planning a refill.' },
  { page: 'lab', mode: 'product', level: 8, sel: null, title: 'Critical alert', say: 'At 10 percent or below the status is Critical. Critical takes precedence over Low Gas.' },
  { page: 'docs', mode: 'product', level: 100, sel: null, title: 'Conclusion and future scope', say: 'GasSense is a concept that turns weight into gas level. Next steps are real calibration, agency booking, leak detection and a distributor dashboard.' },
];
