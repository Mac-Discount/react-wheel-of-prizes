import React, { useEffect, useState } from 'react'

function getWinningSegment(segments) {
  const num = Math.random();
  let sum = 0;

  for (let i in segments) {
    sum += segments[i].probability;
    if (num <= sum) {
      return { name: segments[i].name, index: i };
    }
  }

  return { 
    name: segments[segments.length - 1].name, 
    index: segments.length - 1 
  };
};

const WheelComponent = ({
  segments,
  segColors,
  onFinished,
  primaryColor = 'black',
  contrastColor = 'white',
  buttonText = 'Spin',
  isOnlyOnce = true,
  size = 290,
  upDuration = 100,
  downDuration = 1000,
  fontFamily = 'proxima-nova',
  gameWidth = 1000
}) => {
  let gameHeight = gameWidth; // * .80;
  let needleSize = gameWidth * .10;
  let lineWidth = gameWidth * .02;
  console.log("game dimensions", {
    gameWidth, gameHeight
  })
  let currentSegment = ''
  let isStarted = false
  const [isFinished, setFinished] = useState(false)
  let timerHandle = 0
  const timerDelay = segments.length
  let angleCurrent = 0
  let angleDelta = 0
  let canvasContext = null
  let maxSpeed = Math.PI / `${segments.length}`
  const upTime = segments.length * upDuration
  const downTime = segments.length * downDuration
  let spinStart = 0
  let frames = 0
  const centerX = gameWidth / 2
  const centerY = gameHeight / 2

  /** custom vars */
  let winningSegment = {};
  let downAdjustment = 1;
  let segmentHistory = [];
  let randomizer = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
  let keepGoing = true;

  useEffect(() => {
    wheelInit()
    setTimeout(() => {
      window.scrollTo(0, 1)
    }, 0)
  }, [])
  const wheelInit = () => {
    initCanvas()
    wheelDraw()
  }

  const initCanvas = () => {
    let canvas = document.getElementById('canvas')
    console.log(navigator)
    if (navigator.userAgent.indexOf('MSIE') !== -1) {
      canvas = document.createElement('canvas')
      canvas.setAttribute('width', gameWidth)
      canvas.setAttribute('height', gameHeight)
      canvas.setAttribute('id', 'canvas')
      document.getElementById('wheel').appendChild(canvas)
    }
    canvas.addEventListener('click', spin, false)
    canvasContext = canvas.getContext('2d')
  }
  const spin = () => {
    winningSegment = getWinningSegment(segments);
    console.log("picked winner", { winningSegment })
    isStarted = true
    if (timerHandle === 0) {
      spinStart = new Date().getTime()
      // maxSpeed = Math.PI / ((segments.length*2) + Math.random())
      // maxSpeed = Math.PI / segments.length
      maxSpeed = Math.PI / 20;
      frames = 0
      downAdjustment = 1;
      timerHandle = setInterval(onTimerTick, timerDelay)
    }
  }
  const onTimerTick = () => {
    console.log("in ontimertick");
    frames++
    draw()
    const duration = new Date().getTime() - spinStart
    let progress = 0
    let finished = false
    let newSpeed = 0;
    if (duration < upTime) {
      progress = duration / upTime
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2)
    } else {
      // if (Math.abs(currentIndex - winningSegment.index) > 1)
      // slowDownRate = downAdjustment < .40 ? .0001 : downAdjustment < .30 ? .00001 : slowDownRate;
      if (duration > upTime + downTime) {
        if (currentSegment === winningSegment.name && frames > segments.length) {
          finished = !keepGoing;
        }
        // downAdjustment -= slowDownRate * downAdjustment;
        // console.log("change again", { downAdjustment, currentIndex, toGo: Math.abs(currentIndex - winningSegment.index)});

        progress = upTime / duration
        newSpeed = maxSpeed * progress //* downAdjustment
        angleDelta = newSpeed * Math.sin(progress * Math.PI / 2)
      } else {
        progress = upTime / duration
        newSpeed = maxSpeed * progress
        angleDelta = newSpeed * Math.sin(progress * Math.PI / 2)
      }
    }

    angleCurrent += angleDelta
    while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2

    // console.log("ontimertick", {
    //   progress,
    //   maxSpeed,
    //   newSpeed,
    //   angleDelta,
    //   angleCurrent,
    //   duration,
    //   upTime,
    //   downTime,
    //   finished,
    // })

    if (finished) {
      setFinished(true)
      onFinished(currentSegment)
      clearInterval(timerHandle)
      timerHandle = 0
      angleDelta = 0
    }
  }

  const wheelDraw = () => {
    console.log("in wheeldraw");
    clear()
    drawWheel()
    drawNeedle()
  }

  const draw = () => {
    console.log("in draw");
    clear()
    drawWheel()
    drawNeedle()
  }

  const drawSegment = (key, lastAngle, angle) => {
    console.log("in drawsegment");
    const ctx = canvasContext
    const value = segments[key].name
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, size, lastAngle, angle, false)
    ctx.lineTo(centerX, centerY)
    ctx.closePath()
    ctx.fillStyle = segColors[key]
    ctx.fill()
    ctx.stroke()
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((lastAngle + angle) / 2)
    ctx.fillStyle = contrastColor
    ctx.font = 'bold 1em ' + fontFamily
    ctx.fillText(value.substr(0, 21), size / 2 + 20, 0)
    ctx.restore()
  }

  const drawWheel = () => {
    console.log("in drawwheel");
    const ctx = canvasContext
    let lastAngle = angleCurrent
    const len = segments.length
    const PI2 = Math.PI * 2
    ctx.lineWidth = 1
    ctx.strokeStyle = primaryColor
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = '1em ' + fontFamily
    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + angleCurrent
      drawSegment(i - 1, lastAngle, angle)
      lastAngle = angle
    }

    // Draw a center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, needleSize, 0, PI2, false)
    ctx.closePath()
    ctx.fillStyle = primaryColor
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = contrastColor
    ctx.fill()
    ctx.font = 'bold 1em ' + fontFamily
    ctx.fillStyle = contrastColor
    ctx.textAlign = 'center'
    ctx.fillText(buttonText, centerX, centerY + 3)
    ctx.stroke()

    // Draw outer circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, size, 0, PI2, false)
    ctx.closePath()

    ctx.lineWidth = lineWidth
    ctx.strokeStyle = primaryColor
    ctx.stroke()
  }

  const drawNeedle = () => {
    console.log("in drawneedle");
    const ctx = canvasContext
    ctx.lineWidth = 1
    ctx.strokeStyle = contrastColor
    ctx.fileStyle = contrastColor
    ctx.beginPath()
    ctx.moveTo(centerX + needleSize * .20, centerY - needleSize)
    ctx.lineTo(centerX - needleSize * .20, centerY - needleSize)
    ctx.lineTo(centerX, centerY - needleSize - 20)
    ctx.closePath()
    ctx.fill()
    const change = angleCurrent + Math.PI / 2
    let i =
      segments.length -
      Math.floor((change / (Math.PI * 2)) * segments.length) -
      1
    console.log("change", { change: change, i: i })
    if (i < 0) {
      i = i + segments.length;
    }
    segmentHistory.push(i);
    if (segmentHistory.length > randomizer) { 
      segmentHistory.shift(); 
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = primaryColor
    ctx.font = 'bold 1.5em ' + fontFamily
    if (segmentHistory.every(v => v === segmentHistory[0])) {
      keepGoing = false;
    } else {
      keepGoing = true;
    }
    currentSegment = segments[i].name;
    currentIndex = i;
    // isStarted && ctx.fillText(currentSegment, centerX + 10, centerY + size + 50)
  }
  const clear = () => {
    const ctx = canvasContext
    ctx.clearRect(0, 0, 1000, 800)
  }
  return (
    <div id='wheel'>
      <canvas
        id='canvas'
        width={gameWidth}
        height={gameHeight}
        style={{
          pointerEvents: isFinished && isOnlyOnce ? 'none' : 'auto'
        }}
      />
    </div>
  )
}
export default WheelComponent
