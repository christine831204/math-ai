// 获取 HTML 元素
const videoElement = document.getElementById('video');
const fingerCountElement = document.getElementById('finger-count');
const resultElement = document.getElementById('result');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');

// 使用 MediaPipe Hands 模型
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

// 设置手部检测的参数
hands.setOptions({
  maxNumHands: 1, // 最多检测一只手
  modelComplexity: 1, // 较复杂的模型
  minDetectionConfidence: 0.5, // 检测置信度
  minTrackingConfidence: 0.5 // 跟踪置信度
});

// 处理手部检测结果的函数
hands.onResults(onResults);

// 开启摄像头
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 420
});
camera.start();

// 处理检测结果
function onResults(results) {
  // 清除之前画布上的内容
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 检查是否检测到手
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const hand = results.multiHandLandmarks[0]; // 获取手的关键点
    drawHand(hand); // 绘制关键点
    const fingerCount = countExtendedFingers(hand); // 检测手指数量
    fingerCountElement.textContent = `Detected Fingers: ${fingerCount}`;

    // 验证答案
    if (fingerCount === 5) {
      resultElement.textContent = "Taniah, anda telah menjawab soalan ini dengan betul!";
      resultElement.style.color = "green";
    } else {
      resultElement.textContent = "Jawapan salah, cuba lagi!";
      resultElement.style.color = "red";
    }
  } else {
    fingerCountElement.textContent = "Detected Fingers: 0";
    resultElement.textContent = "";
  }
}

// 绘制手部关键点
function drawHand(keypoints) {
  keypoints.forEach(point => {
    const x = point.x * canvasElement.width;
    const y = point.y * canvasElement.height;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
    canvasCtx.fillStyle = 'red';
    canvasCtx.fill();
  });
}

// 计算伸展手指数量
function countExtendedFingers(keypoints) {
  let extendedFingers = 0;

  // 手指尖端关键点的索引
  const fingerTips = [8, 12, 16, 20]; // 食指、中指、无名指和小指的指尖

  // 检查手指是否伸展
  fingerTips.forEach(tip => {
    if (keypoints[tip].y < keypoints[tip - 2].y) { // 手指尖高于关节
      extendedFingers++;
    }
  });

  // 检查拇指是否伸展
  if (keypoints[4].x > keypoints[3].x) {
    extendedFingers++;
  }

  return extendedFingers;
}
