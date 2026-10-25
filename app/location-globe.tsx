"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import styles from "./location-globe.module.css";

// Natural Earth 110m land, sampled onto this deterministic Fibonacci sphere.
// Dataset, sampling details and coordinate source: docs/location-globe-sources.md.
const POINT_COUNT = 9000;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DEGREES = Math.PI / 180;
const INITIAL_VIEW = { longitude: -48 * DEGREES, latitude: 25 * DEGREES };
const KEY_STEP = 12 * DEGREES;
const LAND_INDICES = new Set(
  "40,43,48,56,61,64,69,74,77,80,82,87,90,95,98,103,111,114,116,124,132,133,134,145,146,149,153,158,163,166,167,179,180,184,187,188,200,201,202,209,213,214,218,219,221,222,223,227,230,231,234,235,238,239,242,243,244,248,251,252,255,256,259,261,262,264,268,269,272,273,276,277,278,279,282,283,285,286,289,290,291,293,294,295,296,298,300,303,304,306,307,310,311,312,313,314,316,317,319,320,322,323,324,325,327,329,330,332,333,334,335,337,338,340,341,344,345,346,347,348,349,350,351,353,354,355,356,357,358,359,361,362,363,366,367,368,369,370,371,372,374,375,376,377,378,379,380,382,384,385,386,387,388,389,390,392,393,395,396,397,398,400,401,402,403,405,406,407,408,409,411,412,413,414,416,418,419,421,422,423,424,426,427,429,430,431,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,450,451,452,455,456,458,460,461,463,464,465,467,468,469,471,473,474,476,477,478,479,481,482,484,486,489,490,491,492,493,494,495,497,498,499,500,501,502,503,505,507,510,511,512,513,515,516,518,519,520,523,524,525,526,527,528,529,531,532,533,534,536,537,539,541,544,545,547,549,550,552,553,554,556,557,558,559,560,562,563,565,566,567,568,570,571,573,575,578,579,580,581,582,583,584,586,587,588,591,592,594,596,599,600,604,607,608,609,612,613,614,615,616,617,618,620,621,622,625,628,630,633,634,635,636,638,641,642,643,646,647,651,654,655,656,659,662,664,667,668,669,671,672,673,675,676,677,680,683,685,688,689,691,692,693,696,697,698,701,702,706,709,710,711,714,716,717,719,722,723,724,726,727,728,730,731,732,735,740,743,744,745,746,747,748,751,752,753,756,757,760,761,762,764,765,766,769,772,774,777,778,780,781,782,785,786,787,790,791,795,798,799,800,803,806,807,808,811,812,815,816,819,820,821,824,828,829,832,833,834,835,836,837,840,841,842,845,846,847,849,850,853,854,855,858,861,862,863,866,867,868,870,871,874,875,876,879,884,887,888,889,891,892,894,895,896,897,900,901,902,904,905,908,909,910,913,915,916,917,918,921,922,923,924,925,926,929,930,931,934,936,938,939,942,943,944,946,947,950,951,952,955,956,957,959,960,963,964,965,968,971,972,973,976,977,978,980,981,984,985,986,989,990,991,993,994,997,998,999,1002,1004,1005,1006,1007,1010,1011,1012,1014,1015,1018,1019,1020,1023,1025,1026,1027,1028,1031,1032,1033,1036,1039,1040,1041,1044,1045,1046,1048,1049,1052,1053,1054,1057,1059,1060,1061,1062,1065,1066,1067,1070,1073,1074,1075,1078,1080,1082,1083,1086,1087,1088,1090,1091,1094,1095,1096,1099,1100,1101,1103,1104,1107,1108,1109,1112,1114,1116,1117,1120,1121,1122,1125,1128,1129,1130,1133,1135,1137,1138,1141,1142,1143,1145,1146,1148,1149,1150,1151,1154,1155,1156,1158,1159,1162,1163,1164,1167,1169,1171,1172,1175,1176,1177,1180,1183,1184,1185,1188,1189,1190,1192,1193,1196,1197,1198,1201,1203,1205,1206,1209,1210,1211,1214,1217,1218,1219,1222,1224,1226,1227,1230,1231,1232,1235,1238,1239,1243,1244,1245,1247,1248,1251,1252,1256,1258,1260,1261,1264,1265,1266,1268,1269,1272,1273,1274,1277,1279,1281,1282,1285,1286,1290,1292,1294,1298,1299,1300,1303,1306,1307,1308,1311,1313,1315,1316,1319,1320,1321,1324,1327,1328,1332,1333,1334,1336,1337,1340,1341,1345,1347,1349,1350,1353,1354,1355,1358,1361,1362,1363,1366,1368,1370,1371,1374,1375,1379,1383,1387,1388,1389,1392,1395,1396,1400,1402,1403,1404,1405,1408,1409,1410,1413,1415,1416,1417,1418,1421,1422,1423,1425,1426,1429,1430,1434,1436,1438,1439,1442,1443,1444,1447,1450,1451,1455,1457,1459,1460,1463,1464,1468,1470,1472,1476,1477,1481,1484,1485,1489,1493,1494,1497,1498,1499,1502,1504,1505,1506,1507,1510,1514,1515,1518,1519,1523,1525,1527,1531,1532,1533,1536,1539,1540,1544,1548,1549,1552,1553,1554,1557,1559,1561,1562,1565,1566,1567,1570,1573,1574,1575,1578,1582,1583,1586,1587,1588,1591,1594,1595,1596,1599,1603,1604,1607,1608,1609,1612,1614,1616,1620,1621,1625,1628,1629,1630,1633,1637,1638,1641,1642,1646,1648,1650,1651,1654,1659,1662,1663,1664,1667,1671,1675,1676,1680,1683,1684,1685,1688,1692,1693,1696,1697,1698,1701,1703,1705,1706,1709,1710,1711,1714,1718,1719,1722,1725,1726,1727,1730,1731,1732,1735,1738,1739,1740,1743,1748,1751,1752,1753,1756,1758,1760,1764,1765,1769,1773,1774,1777,1781,1782,1785,1786,1790,1792,1794,1795,1798,1803,1806,1807,1808,1811,1814,1815,1816,1819,1820,1824,1827,1828,1829,1832,1834,1837,1840,1841,1845,1849,1850,1853,1854,1858,1862,1863,1866,1868,1870,1871,1874,1875,1879,1883,1884,1887,1892,1895,1896,1900,1902,1903,1904,1905,1908,1909,1913,1917,1918,1921,1923,1925,1926,1929,1930,1934,1936,1937,1938,1939,1942,1947,1951,1955,1957,1959,1960,1963,1964,1968,1972,1973,1976,1981,1984,1985,1989,1991,1992,1993,1994,1997,2002,2006,2007,2010,2012,2014,2015,2018,2019,2023,2025,2026,2027,2028,2031,2036,2039,2040,2044,2046,2048,2049,2052,2053,2057,2061,2062,2065,2067,2070,2073,2074,2078,2080,2082,2083,2086,2091,2094,2095,2096,2099,2101,2103,2104,2107,2108,2112,2114,2116,2117,2120,2122,2125,2128,2129,2133,2135,2137,2138,2141,2146,2150,2151,2154,2156,2159,2162,2163,2164,2167,2169,2171,2172,2175,2177,2180,2183,2184,2185,2188,2190,2192,2193,2196,2197,2198,2201,2205,2206,2209,2211,2214,2217,2218,2219,2222,2224,2226,2227,2230,2232,2235,2239,2240,2243,2245,2248,2251,2252,2253,2256,2258,2260,2261,2264,2266,2269,2272,2273,2274,2277,2279,2282,2285,2287,2290,2294,2295,2298,2300,2303,2306,2307,2308,2311,2313,2316,2319,2321,2324,2327,2328,2329,2332,2334,2336,2337,2340,2342,2345,2347,2350,2353,2355,2358,2361,2362,2363,2366,2368,2374,2376,2379,2383,2384,2387,2389,2392,2395,2397,2400,2402,2405,2408,2410,2413,2416,2417,2421,2423,2426,2429,2431,2434,2436,2439,2442,2444,2447,2450,2451,2452,2455,2457,2460,2463,2465,2468,2472,2473,2476,2478,2480,2484,2486,2489,2491,2494,2497,2499,2502,2505,2506,2507,2510,2512,2518,2520,2523,2525,2527,2528,2531,2533,2536,2539,2541,2544,2546,2549,2552,2554,2557,2561,2565,2567,2573,2575,2578,2580,2583,2586,2588,2594,2595,2596,2599,2601,2604,2607,2609,2612,2614,2616,2617,2620,2622,2628,2630,2633,2635,2638,2641,2643,2649,2650,2651,2654,2656,2659,2662,2664,2667,2669,2672,2675,2677,2683,2685,2688,2690,2693,2696,2698,2701,2704,2705,2709,2711,2714,2717,2719,2722,2724,2727,2730,2732,2738,2739,2740,2743,2745,2748,2751,2753,2756,2758,2760,2766,2769,2772,2774,2777,2779,2782,2785,2787,2794,2795,2798,2800,2803,2806,2808,2811,2813,2816,2819,2821,2829,2832,2834,2837,2840,2842,2847,2849,2855,2858,2863,2866,2868,2871,2874,2876,2883,2884,2887,2889,2892,2895,2897,2902,2904,2905,2908,2910,2912,2918,2921,2923,2925,2926,2929,2931,2938,2939,2944,2947,2952,2955,2957,2960,2963,2965,2973,2976,2978,2981,2984,2986,2991,2993,2999,3007,3010,3012,3015,3018,3020,3022,3027,3028,3033,3036,3041,3044,3046,3048,3054,3062,3065,3067,3069,3070,3073,3075,3077,3080,3081,3082,3083,3088,3091,3096,3099,3101,3103,3104,3107,3109,3117,3122,3125,3128,3130,3135,3137,3143,3151,3154,3156,3158,3159,3162,3164,3172,3177,3180,3185,3188,3190,3192,3196,3198,3206,3211,3214,3217,3219,3224,3227,3232,3240,3243,3245,3247,3248,3251,3253,3261,3266,3268,3272,3274,3279,3287,3295,3300,3302,3303,3306,3308,3313,3314,3316,3321,3327,3329,3332,3334,3337,3342,3350,3355,3357,3361,3363,3368,3371,3376,3384,3387,3389,3391,3392,3395,3397,3405,3410,3412,3416,3418,3423,3426,3431,3439,3444,3446,3450,3452,3457,3460,3465,3473,3476,3478,3481,3486,3494,3499,3501,3505,3507,3512,3515,3520,3528,3531,3533,3539,3541,3549,3554,3560,3562,3567,3570,3575,3583,3588,3591,3594,3596,3601,3602,3604,3609,3617,3620,3622,3630,3632,3638,3643,3645,3649,3651,3656,3659,3664,3672,3677,3680,3685,3687,3693,3698,3706,3708,3709,3711,3714,3719,3721,3727,3732,3740,3742,3745,3748,3753,3761,3766,3769,3774,3776,3782,3787,3789,3795,3797,3800,3803,3808,3810,3816,3821,3824,3829,3831,3837,3842,3844,3850,3852,3853,3855,3858,3863,3865,3871,3876,3884,3886,3889,3890,3892,3897,3899,3905,3908,3910,3913,3916,3918,3920,3926,3931,3939,3941,3944,3947,3952,3954,3960,3965,3973,3975,3981,3986,3994,3996,3999,4002,4007,4009,4015,4020,4028,4030,4036,4041,4043,4049,4051,4054,4060,4062,4064,4070,4083,4085,4088,4091,4094,4096,4098,4102,4104,4106,4117,4119,4125,4130,4138,4140,4146,4151,4153,4159,4172,4174,4180,4185,4187,4191,4193,4195,4204,4206,4208,4214,4227,4229,4235,4238,4240,4242,4248,4250,4261,4263,4269,4276,4280,4282,4284,4295,4297,4303,4316,4318,4324,4329,4331,4335,4337,4339,4348,4350,4352,4358,4365,4369,4371,4373,4382,4384,4386,4392,4394,4405,4407,4413,4420,4424,4426,4428,4437,4439,4441,4445,4447,4458,4460,4462,4473,4475,4479,4481,4483,4494,4496,4502,4509,4513,4515,4517,4526,4528,4530,4536,4538,4549,4551,4562,4564,4568,4570,4572,4581,4583,4585,4591,4593,4598,4602,4604,4606,4617,4619,4625,4627,4638,4640,4646,4653,4657,4659,4661,4665,4670,4672,4674,4678,4680,4682,4693,4695,4706,4708,4714,4716,4720,4725,4727,4729,4735,4737,4742,4746,4748,4750,4761,4762,4763,4767,4769,4771,4775,4782,4784,4792,4797,4801,4803,4805,4809,4816,4818,4822,4824,4826,4830,4831,4837,4839,4847,4850,4852,4858,4860,4864,4869,4871,4873,4881,4885,4886,4892,4894,4902,4905,4907,4913,4915,4919,4926,4928,4936,4940,4941,4947,4949,4960,4962,4968,4970,4974,4975,4981,4983,4991,4994,4996,5002,5004,5008,5013,5015,5017,5025,5029,5030,5036,5038,5046,5049,5051,5057,5059,5063,5068,5070,5072,5080,5085,5091,5093,5104,5106,5114,5119,5123,5125,5127,5135,5138,5140,5146,5148,5159,5161,5169,5173,5174,5180,5182,5193,5195,5201,5203,5207,5214,5216,5224,5227,5229,5235,5237,5248,5250,5258,5263,5269,5271,5279,5282,5284,5290,5292,5303,5305,5313,5318,5324,5326,5337,5339,5345,5347,5358,5360,5368,5371,5373,5379,5381,5392,5394,5402,5407,5413,5415,5426,5428,5434,5436,5440,5447,5449,5457,5462,5468,5470,5481,5483,5489,5491,5502,5504,5508,5515,5517,5523,5525,5536,5538,5546,5551,5557,5559,5563,5570,5572,5578,5580,5584,5591,5593,5597,5601,5604,5606,5612,5614,5625,5627,5631,5635,5646,5648,5652,5654,5659,5661,5667,5669,5680,5682,5686,5690,5695,5701,5703,5714,5716,5720,5722,5724,5728,5735,5737,5741,5743,5748,5750,5756,5758,5769,5771,5775,5778,5779,5790,5792,5796,5803,5805,5809,5811,5813,5817,5824,5826,5830,5832,5834,5837,5845,5847,5851,5858,5860,5864,5867,5868,5872,5879,5881,5885,5887,5892,5894,5900,5902,5906,5913,5915,5919,5923,5934,5936,5940,5947,5949,5953,5957,5961,5968,5970,5974,5976,5981,5989,5991,5995,6002,6004,6008,6012,6016,6023,6025,6029,6036,6038,6042,6046,6050,6057,6059,6063,6065,6067,6078,6080,6084,6091,6093,6097,6101,6105,6112,6113,6114,6118,6120,6125,6127,6131,6133,6135,6139,6146,6148,6152,6156,6160,6165,6167,6169,6173,6180,6182,6186,6190,6194,6201,6203,6207,6209,6220,6222,6224,6228,6235,6237,6241,6245,6249,6256,6258,6262,6269,6271,6275,6279,6283,6290,6292,6296,6298,6304,6309,6311,6313,6317,6324,6326,6330,6338,6345,6347,6351,6353,6359,6364,6366,6368,6372,6379,6381,6385,6393,6398,6400,6402,6406,6413,6415,6419,6427,6434,6436,6440,6448,6453,6457,6461,6468,6470,6474,6482,6489,6491,6495,6502,6503,6504,6508,6512,6516,6523,6525,6529,6537,6542,6544,6546,6550,6557,6559,6563,6571,6578,6580,6584,6592,6597,6601,6605,6612,6614,6618,6626,6633,6635,6639,6646,6648,6652,6660,6667,6669,6673,6681,6686,6690,6694,6701,6703,6707,6715,6722,6724,6728,6736,6737,6741,6745,6749,6756,6758,6762,6770,6775,6777,6779,6783,6790,6792,6796,6804,6811,6813,6817,6825,6830,6834,6838,6845,6847,6851,6859,6866,6868,6872,6881,6885,6893,6900,6902,6914,6919,6923,6927,6934,6936,6940,6948,6955,6957,6970,6974,6982,6989,6991,7003,7012,7025,7037,7046,7058,7063,7071,7080,7092,7101,7114,7126,7135,7147,7169,7181,7190,7203,7224,7236,7258,7270,7279,7292,7313,7320,7347,7368,7402,7436,7469,7491,7498,7525,7546,7580,7587,7635,7669,7676,7724,7758,7779,7813,7868,7902,7957,8033,8046,8101,8156,8588,8618,8636,8639,8647,8652,8660,8665,8668,8670,8673,8681,8686,8689,8691,8694,8699,8702,8704,8707,8710,8711,8712,8715,8717,8720,8723,8725,8728,8733,8736,8738,8741,8744,8746,8749,8751,8754,8757,8759,8762,8764,8765,8766,8770,8772,8775,8777,8778,8780,8783,8785,8786,8788,8790,8791,8793,8796,8798,8799,8801,8804,8806,8809,8811,8812,8814,8817,8819,8820,8821,8822,8824,8825,8826,8827,8830,8832,8833,8834,8835,8838,8840,8843,8845,8846,8847,8848,8851,8852,8853,8854,8855,8856,8858,8859,8860,8861,8864,8865,8866,8867,8868,8869,8872,8873,8874,8875,8877,8878,8879,8880,8881,8882,8885,8886,8887,8888,8890,8892,8893,8894,8895,8898,8899,8900,8901,8902,8903,8905,8906,8907,8908,8909,8911,8912,8913,8914,8915,8916,8918,8919,8920,8921,8922,8923,8924,8926,8927,8928,8929,8932,8933,8934,8935,8936,8937,8940,8941,8942,8943,8944,8945,8946,8947,8948,8949,8950,8953,8954,8955,8956,8957,8958,8960,8961,8962,8963,8964,8965,8966,8967,8968,8969,8970,8971,8973,8974,8975,8976,8977,8978,8979,8981,8982,8983,8984,8985,8986,8987,8988,8989,8990,8991,8992,8993,8994,8995,8996,8997,8998,8999"
    .split(",")
    .map(Number),
);

type SpherePoint = { x: number; y: number; z: number; land: boolean };
type Drag = {
  id: number;
  x: number;
  y: number;
  longitude: number;
  latitude: number;
  touch: boolean;
  active: boolean;
  moved: boolean;
};

function spherePoint(latitude: number, longitude: number) {
  const radius = Math.cos(latitude);
  return {
    x: radius * Math.sin(longitude),
    y: Math.sin(latitude),
    z: radius * Math.cos(longitude),
  };
}

const POINTS: SpherePoint[] = Array.from(
  { length: POINT_COUNT },
  (_, index) => {
    const latitude = Math.asin(1 - (2 * (index + 0.5)) / POINT_COUNT);
    const longitude = ((index * GOLDEN_ANGLE) % (Math.PI * 2)) - Math.PI;
    return {
      ...spherePoint(latitude, longitude),
      land: LAND_INDICES.has(index),
    };
  },
);
// Approximate city centre, not a residence or live location.
const QUEBEC = spherePoint(46.813819 * DEGREES, -71.207997 * DEGREES);
const limitLatitude = (value: number) => Math.max(-1.12, Math.min(1.12, value));

export function LocationGlobe({ paused = false }: { paused?: boolean }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const view = useRef({ ...INITIAL_VIEW });
  const drag = useRef<Drag | null>(null);
  const interaction = useRef({
    hovered: false,
    focused: false,
    dragging: false,
  });
  const redraw = useRef<() => void>(() => {});
  const sync = useRef<() => void>(() => {});
  const elapsed = useRef(0);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const element = root.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const context = surface.getContext("2d", { alpha: true });
    if (!context) {
      element.dataset.unavailable = "true";
      element.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
      });
      return;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const theme = element.closest<HTMLElement>("[data-portfolio-theme]");
    let inView = !window.IntersectionObserver;
    let frame = 0;
    let last = 0;
    let painted = 0;
    let width = 260;
    let height = 260;
    let dark = true;
    let disposed = false;

    function palette() {
      dark = theme?.dataset.portfolioTheme !== "light";
      draw();
    }

    function draw() {
      if (disposed) return;
      const ctx = context!;
      const cx = width * 0.51;
      const cy = height * 0.47;
      const radius = Math.min(width, height) * 0.43;
      const scale = radius / 112;
      const cosLon = Math.cos(view.current.longitude);
      const sinLon = Math.sin(view.current.longitude);
      const cosLat = Math.cos(view.current.latitude);
      const sinLat = Math.sin(view.current.latitude);
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      const sphere = ctx.createRadialGradient(
        cx - radius * 0.38,
        cy - radius * 0.43,
        radius * 0.04,
        cx,
        cy,
        radius,
      );
      sphere.addColorStop(0, dark ? "#373a41" : "#f7f9fa");
      sphere.addColorStop(0.56, dark ? "#1c2027" : "#e5ebef");
      sphere.addColorStop(1, dark ? "#080b10" : "#c8d2dc");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = dark ? "#ecf1fa" : "#3f5267";
      for (const point of POINTS) {
        const x = point.x * cosLon - point.z * sinLon;
        const longitudeDepth = point.x * sinLon + point.z * cosLon;
        const y = point.y * cosLat - longitudeDepth * sinLat;
        const depth = point.y * sinLat + longitudeDepth * cosLat;
        if (depth <= 0) continue;
        const lighting =
          0.74 + 0.26 * Math.max(0, -x * 0.27 + y * 0.36 + depth * 0.72);
        ctx.globalAlpha = point.land
          ? (0.23 + depth * 0.68) * lighting
          : dark
            ? 0.025 + depth * 0.035
            : 0.035 + depth * 0.035;
        const dotRadius = (point.land ? 0.46 + depth * 0.32 : 0.3) * scale;
        ctx.beginPath();
        ctx.arc(cx + x * radius, cy - y * radius, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = dark ? 0.18 : 0.28;
      ctx.strokeStyle = dark ? "#c4d5ed" : "#8194a8";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      const mx = QUEBEC.x * cosLon - QUEBEC.z * sinLon;
      const mz = QUEBEC.x * sinLon + QUEBEC.z * cosLon;
      const my = QUEBEC.y * cosLat - mz * sinLat;
      const depth = QUEBEC.y * sinLat + mz * cosLat;
      if (depth > 0.025) {
        const opacity = Math.min(1, (depth - 0.025) * 5);
        const x = cx + mx * radius;
        const y = cy - my * radius;
        const pulse = 8 + Math.sin(elapsed.current / 1600) * 1.1;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, pulse * scale);
        glow.addColorStop(0, dark ? "#ffffffc0" : "#1d456f80");
        glow.addColorStop(1, "#ffffff00");
        ctx.globalAlpha = opacity;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, pulse * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = dark ? "#ffffffb3" : "#365d86a0";
        ctx.beginPath();
        ctx.arc(x, y, 5.2 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = dark ? "#ffffff" : "#22486f";
        ctx.beginPath();
        ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      surface!.dataset.ready = "true";
    }

    function tick(now: number) {
      if (disposed) return;
      const delta = last ? Math.min(now - last, 80) : 0;
      last = now;
      view.current.longitude += delta * 0.000035;
      elapsed.current += delta;
      if (now - painted >= 32) {
        draw();
        painted = now;
      }
      frame = window.requestAnimationFrame(tick);
    }

    function updateMotion() {
      window.cancelAnimationFrame(frame);
      last = 0;
      const user = interaction.current;
      if (
        inView &&
        !document.hidden &&
        !paused &&
        !motion.matches &&
        !user.hovered &&
        !user.focused &&
        !user.dragging
      ) {
        frame = window.requestAnimationFrame(tick);
      } else draw();
    }

    function resize() {
      const bounds = element!.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      surface!.width = Math.round(width * ratio);
      surface!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    redraw.current = draw;
    sync.current = updateMotion;
    const observer = window.IntersectionObserver
      ? new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
            updateMotion();
          },
          { threshold: 0.05 },
        )
      : null;
    observer?.observe(element);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(element);
    const themeObserver = new MutationObserver(palette);
    if (theme)
      themeObserver.observe(theme, {
        attributes: true,
        attributeFilter: ["data-portfolio-theme"],
      });
    document.addEventListener("visibilitychange", updateMotion);
    motion.addEventListener("change", updateMotion);
    window.addEventListener("resize", resize);
    resize();
    palette();
    updateMotion();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      sizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", updateMotion);
      motion.removeEventListener("change", updateMotion);
      window.removeEventListener("resize", resize);
      redraw.current = () => {};
      sync.current = () => {};
    };
  }, [paused]);

  function resetView() {
    view.current = { ...INITIAL_VIEW };
    redraw.current();
    setAnnouncement("Globe reset to Quebec City.");
  }

  function rotate(longitude: number, latitude = 0) {
    view.current.longitude += longitude;
    view.current.latitude = limitLatitude(view.current.latitude + latitude);
    redraw.current();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") rotate(-KEY_STEP);
    else if (event.key === "ArrowRight") rotate(KEY_STEP);
    else if (event.key === "ArrowUp") rotate(0, KEY_STEP * 0.65);
    else if (event.key === "ArrowDown") rotate(0, -KEY_STEP * 0.65);
    else if (event.key === "Home") resetView();
    else return;
    event.preventDefault();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const touch = event.pointerType !== "mouse";
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      longitude: view.current.longitude,
      latitude: view.current.latitude,
      touch,
      active: !touch,
      moved: false,
    };
    if (!touch) {
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      interaction.current.dragging = true;
      root.current?.setAttribute("data-dragging", "true");
      sync.current();
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.touch && !current.active) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy)) return;
      current.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      interaction.current.dragging = true;
      root.current?.setAttribute("data-dragging", "true");
      sync.current();
    }
    if (Math.abs(dx) + Math.abs(dy) > 2) current.moved = true;
    view.current.longitude = current.longitude - dx * 0.009;
    if (!current.touch)
      view.current.latitude = limitLatitude(current.latitude + dy * 0.006);
    redraw.current();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    const moved = drag.current.moved;
    drag.current = null;
    interaction.current.dragging = false;
    root.current?.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    sync.current();
    if (moved)
      setAnnouncement("Globe rotated. Reset view returns to Quebec City.");
  }

  return (
    <div
      ref={root}
      className={styles.globe}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          interaction.current.hovered = true;
          sync.current();
        }
      }}
      onPointerLeave={() => {
        interaction.current.hovered = false;
        sync.current();
      }}
      onFocusCapture={() => {
        interaction.current.focused = true;
        sync.current();
      }}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          interaction.current.focused = false;
          sync.current();
        }
      }}
    >
      <div
        id={`${id}-view`}
        className={styles.interaction}
        tabIndex={0}
        role="group"
        aria-label="Interactive globe with a Quebec City marker"
        aria-describedby={`${id}-help`}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <span className={styles.fallback} aria-hidden="true" />
        <canvas
          ref={canvas}
          className={styles.canvas}
          width={520}
          height={520}
          aria-hidden="true"
        />
      </div>
      <div className={styles.controls} role="group" aria-label="Globe controls">
        <button
          type="button"
          aria-label="Rotate globe west"
          title="Rotate west"
          aria-controls={`${id}-view`}
          onClick={() => rotate(-KEY_STEP)}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m11.5 5-5 5 5 5" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Reset globe view to Quebec City"
          title="Reset view"
          aria-controls={`${id}-view`}
          onClick={resetView}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5.5 5.5A6 6 0 1 1 4 10M3 3.5v4h4" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Rotate globe east"
          title="Rotate east"
          aria-controls={`${id}-view`}
          onClick={() => rotate(KEY_STEP)}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m8.5 5 5 5-5 5" />
          </svg>
        </button>
      </div>
      <p id={`${id}-help`} className={styles.srOnly}>
        Drag horizontally to rotate. Arrow keys rotate and tilt the globe. Press
        Home or Reset view to return to Quebec City. Vertical touch gestures
        scroll the page.
      </p>
      <p className={styles.srOnly} role="status">
        {announcement}
      </p>
    </div>
  );
}
