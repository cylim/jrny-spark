import type { MessageKey } from "./messages";

// Korean catalog. Keys mirror en.ts; anything missing falls back to English.
export const ko: Partial<Record<MessageKey, string>> = {
  "nav.play": "플레이",
  "nav.templates": "내 템플릿",
  "nav.settings": "설정",

  "home.headline.before": "놀다 보면 ",
  "home.headline.accent": "더 가까워지는",
  "home.headline.after": " 우리.",
  "home.subtitle":
    "둘만의 보드게임 여정. 주사위를 굴리고, 사다리를 오르고, 카드를 뽑다 보면 평범한 밤이 특별해져요.",
  "home.cta": "지금 시작하기",
  "home.noAccount": "계정 없이 바로. 폰 하나, 두 사람.",
  "home.feature1.title": "굴리고 나아가요",
  "home.feature1.body":
    "한 끗 다른 클래식 보드 — 사다리는 서로를 가깝게, 뱀은 짓궂은 도전을 건네요.",
  "home.feature2.title": "카드를 뽑아요",
  "home.feature2.body":
    "달콤, 설렘, 화끈 — 단계는 두 사람이 고르고, 올라갈수록 온도가 조금씩 오르죠.",
  "home.feature3.title": "둘만의 비밀",
  "home.feature3.body":
    "게임에서 있었던 일은 절대 폰 밖으로 나가지 않아요. 영원히.",
  "home.footer.byline": "JRNY가 만들었어요",
  "home.footer.privacy": "개인정보를 다루는 방식",

  "tier.sweet": "달콤",
  "tier.flirty": "설렘",
  "tier.spicy": "화끈",
  "tier.sweet.blurb": "따뜻하고 궁금한",
  "tier.flirty.blurb": "장난스럽고 짓궂은",
  "tier.spicy.blurb": "은밀한 · 18+",

  "setup.title": "분위기를 골라요",
  "setup.resume": "하던 게임 이어하기 ▶",
  "setup.resume.turn": "{turn}번째 턴",
  "setup.players": "플레이어",
  "setup.players.note": "이름은 이 폰에만 남아요 — 절대 업로드되지 않아요.",
  "setup.players.placeholder": "플레이어 {n}",
  "setup.tier": "단계",
  "setup.deck": "덱",
  "setup.deck.cards": "카드 {count}장",
  "setup.deck.noneConvex":
    "아직 {tier} 덱이 없어요 — `bun run seed`로 스타터 덱을 불러오세요.",
  "setup.deck.noneSample":
    "아직 {tier} 덱이 없어요 — 내장된 샘플 덱으로 진행돼요.",
  "setup.skips": "1인당 스킵 횟수",
  "setup.start": "여정을 시작해요",

  // — shared skip-budget picker (context-neutral; used in setup and builder) —
  "skips.note":
    "스킵은 카드를 새 카드로 바꿔요. 카드를 그냥 덮어두는 패스는 언제나 무제한이에요.",
  "skips.unlimited": "무제한",

  "play.loading": "게임을 불러오는 중…",
  "play.turn": "{name}의 차례",
  "play.tile": "{tile}번 칸",
  "play.tile.start": "출발",
  "play.end": "게임 끝내기",
  "play.end.confirm":
    "이 게임을 끝낼까요? 게임 중의 기록은 아무것도 저장되지 않아요.",
  "play.deck.loading": "덱을 불러오는 중…",
  "play.deck.unavailable":
    "지금은 이 덱을 사용할 수 없어요 — 연결을 확인하거나, 게임을 끝내고 다른 덱을 골라 주세요.",

  "card.reason.tile": "당신의 카드",
  "card.reason.ladder": "더 가까워지는 카드 🪜",
  "card.reason.charm": "뱀을 홀렸어요 🐍",
  "card.kind.question": "서로에게 물어봐요",
  "card.kind.action": "해 보세요",
  "card.kind.together": "함께해요",
  "card.done": "완료 ✨",
  "card.pass": "패스",
  "card.skip": "스킵 · {count}번 남음",
  "card.skip.unlimited": "스킵",
  "card.consent": "패스해도 괜찮아요. 어느 쪽이든 아무것도 기록되지 않아요.",

  "snake.title": "{name}, 뱀이에요!",
  "snake.body":
    "{from}에서 {to}까지 미끄러지거나… 도전 카드로 뱀을 홀리고 그 자리에 버텨요.",
  "snake.charm": "뱀을 홀릴래요 — 도전 카드 받기",
  "snake.accept": "{to}까지 미끄러질래요",

  "exhaust.title": "여기 카드는 전부 봤어요",
  "exhaust.body":
    "{tier} 덱의 이 구간은 새 카드가 다 떨어졌어요. 다시 섞어서 계속하거나, 함께 한 단계 올라가요.",
  "exhaust.stay": "다시 섞고 {tier} 유지",
  "exhaust.advance": "{tier}(으)로 올라가기",
  "exhaust.advance.note":
    "올라가려면 두 사람 모두 눌러야 해요 — 저절로 바뀌는 일은 없어요.",
  "exhaust.confirm": "{name}: 좋아요",
  "exhaust.confirmed": "{name} 동의 ✓",
  "exhaust.back": "뒤로",

  "recap.empty": "아직 끝낸 게임이 없어요.",
  "recap.empty.cta": "시작해 볼까요",
  "recap.headline": "결승점에 먼저 도착: {name}!",
  "recap.subtitle": "함께 끝낸 {tier} 여정이었어요.",
  "recap.stat.minutes": "함께한 시간(분)",
  "recap.stat.cards": "뽑은 카드",
  "recap.stat.ladders": "오른 사다리",
  "recap.stat.charmed": "홀린 뱀",
  "recap.stat.slides": "미끄러진 횟수",
  "recap.stat.rolls": "주사위 횟수",
  "recap.stat.skips": "사용한 스킵",
  "recap.again": "한 판 더",
  "recap.home": "홈으로",
  "recap.privacy":
    "이 요약은 이 폰에만 남아요. 무엇을 말하고 했는지는 어디에도 저장되지 않아요.",

  "ageGate.title": "성인 전용",
  "ageGate.body":
    "화끈 단계에는 성인을 위한 은밀한 콘텐츠가 담겨 있어요. 두 사람 모두 만 18세 이상인지 확인해 주세요.",
  "ageGate.confirm": "둘 다 18세 이상이에요",
  "ageGate.cancel": "돌아가기",

  "settings.title": "설정",
  "settings.account": "계정",
  "settings.account.signedIn": "로그인됨 — 템플릿이 동기화돼요.",
  "settings.account.why": "템플릿을 저장할 때만 필요해요.",
  "settings.account.signIn": "로그인",
  "settings.account.unconfigured":
    "로그인이 설정되지 않았어요 — README를 참고하세요.",
  "settings.language": "언어",
  "settings.content": "콘텐츠",
  "settings.age": "18+ 확인:",
  "settings.age.confirmed": "확인됨",
  "settings.age.notConfirmed": "미확인",
  "settings.age.reset": "초기화",
  "settings.app": "앱",
  "settings.app.installed": "이 기기에 설치됨 ✓",
  "settings.app.install": "이 기기에 Spark 설치하기",
  "settings.app.iosHint.before": "iPhone에 설치하려면 ",
  "settings.app.iosHint.share": "공유",
  "settings.app.iosHint.mid": " → ",
  "settings.app.iosHint.add": "홈 화면에 추가",
  "settings.app.iosHint.after": "를 눌러 주세요.",
  "settings.app.eligible": "조건이 갖춰지면 브라우저가 설치를 제안할 거예요.",
  "settings.usage": "사용 통계",
  "settings.usage.toggle": "익명 사용 통계 보내기",
  "settings.usage.body":
    "횟수만 세요 — 게임이 시작됐다, 카드를 스킵했다 정도예요. 카드 내용, 플레이어 이름, 어떤 카드를 뽑았는지는 절대 보내지 않아요. 쿠키 없이 PostHog(미국)로 전송되며 언제든 끌 수 있어요.",
  "settings.usage.on": "켜짐",
  "settings.usage.off": "꺼짐",
  "settings.data": "내 데이터",
  "settings.data.body":
    "진행 중인 게임, 요약, 환경설정, 캐시된 덱은 모두 이 기기에만 있어요.",
  "settings.data.privacyLink": "개인정보 처리 방식 읽기",
  "settings.data.clear": "로컬 데이터 모두 지우기",
  "settings.data.cleared": "지웠어요 ✓",
  "settings.data.confirm":
    "이 기기의 Spark 데이터를 전부 지울까요? 되돌릴 수 없어요.",

  "templates.title": "내 템플릿",
  "templates.new": "+ 새로 만들기",
  "templates.blurb":
    "템플릿에는 설정만 담겨요 — 보드, 덱, 직접 꽂아 둔 카드. 게임 중에 있었던 일은 절대 담기지 않아요.",
  "templates.unconfigured.before":
    "클라우드 저장에는 Clerk + Convex 설정이 필요해요. 저장 없이도 ",
  "templates.unconfigured.link": "새 템플릿",
  "templates.unconfigured.after": "에서 만들고 플레이할 수 있어요.",
  "templates.signIn.note": "로그인하면 어느 기기에서든 템플릿을 쓸 수 있어요.",
  "templates.signIn": "로그인",
  "templates.loading": "불러오는 중…",
  "templates.empty.before": "아직 저장된 게 없어요 — ",
  "templates.empty.new": "+ 새로 만들기",
  "templates.empty.after": "로 만들어 보세요.",
  "templates.meta.pins": "꽂은 카드 {count}장",
  "templates.meta.skips": "스킵 {count}번",
  "templates.meta.skips.unlimited": "스킵 무제한",
  "templates.play": "플레이",
  "templates.delete": "삭제",
  "templates.delete.confirm": '"{name}"을(를) 삭제할까요?',

  "builder.title": "템플릿 만들기",
  "builder.blurb":
    "원하는 칸에 나만의 카드를 꽂아요 — 둘만 아는 농담, 진짜 계획, 직접 만든 도전. 그 칸에서는 덱 대신 이 카드가 나와요.",
  "builder.name": "이름",
  "builder.name.placeholder": "기념일 스페셜",
  "builder.tier": "단계",
  "builder.deck": "덱",
  "builder.deck.sample": "샘플 덱",
  "builder.skips": "1인당 스킵 횟수",
  "builder.pins": "꽂은 카드",
  "builder.pins.add": "+ 카드 추가",
  "builder.pins.tile": "칸",
  "builder.pins.kind.question": "질문",
  "builder.pins.kind.action": "행동",
  "builder.pins.kind.together": "함께",
  "builder.pins.remove": "지우기",
  "builder.pins.placeholder": "프롬프트 내용을 적어 주세요…",
  "builder.pin.outOfRange": "1과 99 사이의 칸을 골라 주세요.",
  "builder.pin.snakeHead":
    "그 칸은 뱀의 머리예요 — 미끄러지느라 카드가 묻혀 버려요.",
  "builder.pin.ladderFoot":
    "그 칸은 사다리 발판이에요 — 오르느라 카드를 건너뛰게 돼요.",
  "builder.pin.finish": "도착 칸은 게임이 끝나는 곳이라 카드가 나올 수 없어요.",
  "builder.play": "바로 플레이",
  "builder.blocked": "표시된 카드를 먼저 빈 칸으로 옮겨 주세요.",
  "builder.save": "내 템플릿에 저장",
  "builder.saving": "저장 중…",
  "builder.save.error":
    "저장하지 못했어요 — 연결과 로그인을 확인하고 다시 시도해 주세요.",
  "builder.save.signIn": "로그인하고 이 템플릿 저장하기",
  "builder.save.unconfigured":
    "저장에는 Clerk + Convex 설정이 필요해요 — 플레이는 지금도 가능해요.",

  "privacy.title": "쉽게 읽는 개인정보 이야기",
  "privacy.intro.before":
    "Spark는 친밀함을 다루는 게임이라, 예외 없는 원칙 하나를 지켜요: ",
  "privacy.intro.strong": "게임 중에 일어난 일은 당신의 폰에만 남아요.",
  "privacy.know.title": "서버가 아는 것",
  "privacy.know.1": "당신이 누구인지 — 계정을 만든 경우에만",
  "privacy.know.2": "직접 저장한 게임 설정(보드, 단계, 커스텀 카드 내용)",
  "privacy.know.3": "구매 내역 — 프리미엄 덱이 생긴 뒤의 이야기예요",
  "privacy.never.title": "서버가 절대 모르는 것",
  "privacy.never.1": "게임 중에 있었던 그 어떤 일도",
  "privacy.never.2": "어떤 카드를 뽑고, 답하고, 스킵했는지",
  "privacy.never.3": "플레이어 이름 — 기기 밖으로 나가지 않아요",
  "privacy.never.4": "답변, 메모, 사진 — 애초에 받을 방법 자체가 없어요",
  "privacy.analytics.title": "익명 사용 통계 (PostHog, 미국)",
  "privacy.analytics.body":
    "Spark가 잘 작동하는지 — 게임이 얼마나 시작되고 끝나는지, 카드를 얼마나 자주 스킵하는지 — 알기 위해 정해진 짧은 이벤트 목록만 미국에 호스팅된 PostHog로 보내요. 쿠키도, 세션 녹화도, 자동 수집도 없어요. 아래 이벤트와 아래 항목만이에요. 같은 기기의 이벤트를 묶기 위해 이 브라우저 저장소에 무작위 익명 ID 하나를 두는데, 로컬 데이터를 지우거나 사용 통계를 끄면 함께 삭제돼요.",
  "privacy.analytics.collected.title": "보내는 것",
  "privacy.analytics.collected.1": "지금 어떤 화면에 있는지",
  "privacy.analytics.collected.2":
    "게임이 시작됐는지(단계)와 끝났는지(대략의 길이와 카드 수)",
  "privacy.analytics.collected.3":
    "카드를 보여줬는지(구간, 종류, 뽑힌 이유만), 스킵했는지, 패스했는지",
  "privacy.analytics.collected.4":
    "뱀(홀리기/미끄러지기)·유지/올라가기·설치·설정에서의 선택, 템플릿을 저장했다는 사실, 오류가 났다는 사실(오류 종류만, 내용은 절대)",
  "privacy.analytics.collected.5": "기기 종류(폰, 태블릿, 데스크톱)와 앱 언어",
  "privacy.analytics.never.title": "절대 보내지 않는 것",
  "privacy.analytics.never.1": "카드 내용, 어떤 카드를 뽑았는지",
  "privacy.analytics.never.2":
    "플레이어 이름, 답변, 템플릿 이름, 직접 입력한 모든 것",
  "privacy.analytics.never.3":
    "세션 녹화, 자동 수집된 터치, 쿠키, 위치(IP 조회를 꺼 두었어요)",
  "privacy.analytics.optout.before": "언제든 ",
  "privacy.analytics.optout.link": "설정 → 사용 통계",
  "privacy.analytics.optout.after": "에서 끌 수 있어요.",
  "privacy.outro.before":
    "진행 중인 게임, 요약, 환경설정은 이 브라우저의 로컬 저장소에만 보관돼요. ",
  "privacy.outro.link": "설정 → 로컬 데이터 모두 지우기",
  "privacy.outro.after":
    "에서 전부 지울 수 있어요. 플레이에 계정은 필요 없고, 광고도 없으며, 위의 익명 사용 통계 외에는 아무것도 추적하지 않아요.",

  "dice.roll": "주사위 굴리기",
};
