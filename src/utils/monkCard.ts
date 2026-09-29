import type { CampaignPlayer } from '../types'
import monkA from '../assets/characters/ranks/monge/portrait.png'
import monkB from '../assets/characters/ranks/monge/portrait-base-b.png'

export function monkDate(player: CampaignPlayer) {
  return player.lastCheckIn && Number.isFinite(player.lastCheckIn.getTime())
    ? player.lastCheckIn.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Conquista registrada'
}

export async function renderMonkCard(player: CampaignPlayer, campaignName: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Seu navegador não conseguiu criar o cartão.')
  const background = context.createRadialGradient(540, 490, 30, 540, 610, 830)
  background.addColorStop(0, '#293c3c')
  background.addColorStop(0.4, '#102327')
  background.addColorStop(1, '#030708')
  context.fillStyle = background
  context.fillRect(0, 0, 1080, 1350)

  // Light shafts, a celestial seal and rising embers surround the original art.
  context.save()
  context.translate(540, 520)
  for (let ray = 0; ray < 48; ray++) {
    context.rotate(Math.PI / 24)
    const beam = context.createLinearGradient(0, 110, 0, 720)
    beam.addColorStop(0, '#e6cd8820')
    beam.addColorStop(1, '#e6cd8800')
    context.fillStyle = beam
    context.beginPath()
    context.moveTo(-2, 110)
    context.lineTo(-14, 720)
    context.lineTo(14, 720)
    context.closePath()
    context.fill()
  }
  context.restore()

  const halo = context.createRadialGradient(540, 505, 90, 540, 505, 400)
  halo.addColorStop(0, '#ffdf9033')
  halo.addColorStop(0.65, '#eac17015')
  halo.addColorStop(1, '#eac17000')
  context.fillStyle = halo
  context.fillRect(90, 80, 900, 900)

  for (const radius of [292, 310, 345]) {
    context.beginPath()
    context.arc(540, 505, radius, 0, Math.PI * 2)
    context.strokeStyle = radius === 310 ? '#efd49788' : '#efd49730'
    context.lineWidth = radius === 310 ? 2 : 1
    context.stroke()
  }
  for (let mark = 0; mark < 60; mark++) {
    const angle = mark * Math.PI / 30
    const inner = mark % 5 === 0 ? 318 : 329
    context.beginPath()
    context.moveTo(540 + Math.cos(angle) * inner, 505 + Math.sin(angle) * inner)
    context.lineTo(540 + Math.cos(angle) * 341, 505 + Math.sin(angle) * 341)
    context.strokeStyle = mark % 5 === 0 ? '#f4d794aa' : '#f4d79444'
    context.stroke()
  }

  context.save()
  context.shadowColor = '#ffd887'
  context.shadowBlur = 24
  context.strokeStyle = '#f7d99499'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(540, 430)
  context.bezierCurveTo(435, 280, 225, 280, 225, 430)
  context.bezierCurveTo(225, 580, 435, 580, 540, 430)
  context.bezierCurveTo(645, 280, 855, 280, 855, 430)
  context.bezierCurveTo(855, 580, 645, 580, 540, 430)
  context.stroke()
  context.restore()

  let seed = 73
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let particle = 0; particle < 145; particle++) {
    const x = 75 + random() * 930
    const y = 180 + random() * 755
    const radius = 0.6 + random() * 2
    context.fillStyle = `rgba(255, 222, 159, ${0.12 + random() * 0.65})`
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
    if (particle % 11 === 0) {
      context.fillRect(x - 7, y - 0.5, 14, 1)
      context.fillRect(x - 0.5, y - 7, 1, 14)
    }
  }

  const gold = context.createLinearGradient(0, 0, 1080, 1350)
  gold.addColorStop(0, '#805c2b')
  gold.addColorStop(0.25, '#f8dfa0')
  gold.addColorStop(0.5, '#ae8540')
  gold.addColorStop(0.8, '#f4d393')
  gold.addColorStop(1, '#715126')
  context.strokeStyle = gold
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(76, 38)
  context.lineTo(1004, 38)
  context.lineTo(1042, 76)
  context.lineTo(1042, 1274)
  context.lineTo(1004, 1312)
  context.lineTo(76, 1312)
  context.lineTo(38, 1274)
  context.lineTo(38, 76)
  context.closePath()
  context.stroke()
  context.strokeStyle = '#e8ca8538'
  context.lineWidth = 1
  context.strokeRect(52, 52, 976, 1246)
  for (const [x, y, directionX, directionY] of [[70, 70, 1, 1], [1010, 70, -1, 1], [70, 1280, 1, -1], [1010, 1280, -1, -1]]) {
    context.strokeStyle = gold
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(x, y + directionY * 72)
    context.lineTo(x, y)
    context.lineTo(x + directionX * 72, y)
    context.stroke()
  }

  context.textAlign = 'center'
  context.fillStyle = '#f0d69e'
  context.font = '600 24px Georgia'
  context.fillText(campaignName.toUpperCase(), 540, 109, 850)
  context.fillStyle = '#a9b4ac'
  context.font = '18px Georgia'
  context.fillText('A ÚLTIMA TRAVESSIA', 540, 147)
  const portrait = new Image()
  portrait.src = player.avatarBase === 'base-b' ? monkB : monkA
  await portrait.decode()
  context.save()
  context.shadowColor = '#9fddf355'
  context.shadowBlur = 32
  context.drawImage(portrait, 135, 158, 810, 810)
  context.restore()

  const pedestal = context.createLinearGradient(0, 875, 0, 1030)
  pedestal.addColorStop(0, '#060c0e00')
  pedestal.addColorStop(1, '#060c0e')
  context.fillStyle = pedestal
  context.fillRect(85, 875, 910, 410)
  context.fillStyle = '#d4b574'
  context.font = '18px Georgia'
  context.fillText('PATENTE MÍTICA  /  30 DIAS DE COMBATE', 540, 954)

  const titleGold = context.createLinearGradient(0, 973, 0, 1060)
  titleGold.addColorStop(0, '#fff8df')
  titleGold.addColorStop(0.6, '#ecd099')
  titleGold.addColorStop(1, '#b08a46')
  context.fillStyle = titleGold
  context.font = 'bold 100px Georgia'
  context.fillText('MONGE ∞', 540, 1054)

  context.fillStyle = '#fff3d6'
  let nicknameSize = 48
  context.font = `bold ${nicknameSize}px Georgia`
  while (context.measureText(player.nickname).width > 850 && nicknameSize > 22) {
    nicknameSize -= 1
    context.font = `bold ${nicknameSize}px Georgia`
  }
  context.fillText(player.nickname, 540, 1123, 850)
  context.strokeStyle = '#d6b77766'
  context.lineWidth = 1
  for (const [from, to] of [[240, 505], [575, 840]]) {
    context.beginPath()
    context.moveTo(from, 1157)
    context.lineTo(to, 1157)
    context.stroke()
  }
  context.fillStyle = '#e9cd91'
  context.beginPath()
  context.moveTo(540, 1148)
  context.lineTo(549, 1157)
  context.lineTo(540, 1166)
  context.lineTo(531, 1157)
  context.closePath()
  context.fill()
  context.fillStyle = '#e6ddc6'
  context.font = 'italic 29px Georgia'
  context.fillText('A maior vitória foi sobre si mesmo.', 540, 1206)
  context.fillStyle = '#bca777'
  context.font = '19px Georgia'
  context.fillText(`ASCENSÃO  ·  ${monkDate(player)}`, 540, 1260)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível gerar o cartão.')), 'image/png'))
}
