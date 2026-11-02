export interface DemoLine {
  startMs: number;
  text: string;
  translation: string;
  gold: string[];
}

// Adapted from Kanaoke's small example map and expanded to the 20 lines required
// by the Development Plan. The audio is generated locally and contains a cue at
// each timestamp, so no copyrighted song is committed.
export const DEMO_LINES: DemoLine[] = [
  { startMs: 0, text: '桜の花びらが舞い散る', translation: 'Cherry blossom petals scatter', gold: ['桜', 'の', '花びら', 'が', '舞い散る'] },
  { startMs: 1500, text: '春の風に揺れる想い', translation: 'Feelings sway in the spring wind', gold: ['春', 'の', '風', 'に', '揺れる', '想い'] },
  { startMs: 3000, text: '君との日々が遠く', translation: 'Our days are far away', gold: ['君', 'と', 'の', '日々', 'が', '遠く'] },
  { startMs: 4500, text: '今は一人で歩く', translation: 'Now I walk alone', gold: ['今', 'は', '一人', 'で', '歩く'] },
  { startMs: 6000, text: '夢の中でも会えるかな', translation: 'Can I meet you in my dreams?', gold: ['夢', 'の', '中', 'でも', '会える', 'か', 'な'] },
  { startMs: 7500, text: 'あの日の笑顔を思い出す', translation: 'I remember that smile', gold: ['あの', '日', 'の', '笑顔', 'を', '思い出す'] },
  { startMs: 9000, text: '時は流れて変わっても', translation: 'Even if time flows and changes', gold: ['時', 'は', '流れて', '変わって', 'も'] },
  { startMs: 10500, text: '心は変わらない', translation: 'My heart will not change', gold: ['心', 'は', '変わらない'] },
  { startMs: 12000, text: '朝の光が窓を照らす', translation: 'Morning light shines through the window', gold: ['朝', 'の', '光', 'が', '窓', 'を', '照らす'] },
  { startMs: 13500, text: '新しい道を探す', translation: 'I search for a new road', gold: ['新しい', '道', 'を', '探す'] },
  { startMs: 15000, text: '小さな鳥が空を飛ぶ', translation: 'A small bird flies in the sky', gold: ['小さな', '鳥', 'が', '空', 'を', '飛ぶ'] },
  { startMs: 16500, text: '青い波が海に消える', translation: 'Blue waves disappear into the sea', gold: ['青い', '波', 'が', '海', 'に', '消える'] },
  { startMs: 18000, text: '雨の音を静かに聞く', translation: 'I quietly listen to the rain', gold: ['雨', 'の', '音', 'を', '静か', 'に', '聞く'] },
  { startMs: 19500, text: '古い写真をそっと開く', translation: 'I gently open an old photo', gold: ['古い', '写真', 'を', 'そっと', '開く'] },
  { startMs: 21000, text: '忘れた歌をもう一度歌う', translation: 'I sing the forgotten song once more', gold: ['忘れた', '歌', 'を', 'もう', '一度', '歌う'] },
  { startMs: 22500, text: '言葉は風に乗って届く', translation: 'Words ride the wind and arrive', gold: ['言葉', 'は', '風', 'に', '乗って', '届く'] },
  { startMs: 24000, text: '星が夜の街を守る', translation: 'Stars watch over the city at night', gold: ['星', 'が', '夜', 'の', '街', 'を', '守る'] },
  { startMs: 25500, text: '君の声が近くに聞こえる', translation: 'I hear your voice nearby', gold: ['君', 'の', '声', 'が', '近く', 'に', '聞こえる'] },
  { startMs: 27000, text: '明日もまたここで会おう', translation: 'Let us meet here again tomorrow', gold: ['明日', 'も', 'また', 'ここ', 'で', '会おう'] },
  { startMs: 28500, text: '未来へ続く道を歩く', translation: 'I walk the road toward the future', gold: ['未来', 'へ', '続く', '道', 'を', '歩く'] },
];
