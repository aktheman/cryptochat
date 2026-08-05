(() => {
  'use strict';

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  const EMOJI_MAP = {
    ':smile:':'😊',':happy:':'😊',':laugh:':'😂',':joy:':'😂',':sad:':'😢',':cry:':'😢',':heart:':'❤️',':love:':'😍',':wink:':'😉',':wow:':'😮',':angry:':'😠',':mad:':'😡',':cool:':'😎',':sunglasses:':'😎',':blush:':'☺️',':kiss:':'😘',':hug:':'🤗',':think:':'🤔',':shrug:':'🤷',':facepalm:':'🤦',':eyes:':'👀',':fire:':'🔥',':star:':'⭐',':thumbsup:':'👍',':thumbsdown:':'👎',':ok:':'👌',':clap:':'👏',':wave:':'👋',':rocket:':'🚀',':check:':'✅',':x:':'❌',':warning:':'⚠️',':question:':'❓',':exclamation:':'❗',':100:':'💯',':party:':'🎉',':tada:':'🎉',':confetti:':'🎊',':balloon:':'🎈',':gift:':'🎁',':bell:':'🔔',':lock:':'🔒',':unlock:':'🔓',':key:':'🔑',':mail:':'✉️',':phone:':'📞',':camera:':'📷',':video:':'📹',':music:':'🎵',':note:':'🎶',':headphones:':'🎧',':game:':'🎮',':soccer:':'⚽',':basketball:':'🏀',':football:':'🏈',':baseball:':'⚾',':tennis:':'🎾',':golf:':'⛳',':swim:':'🏊',':run:':'🏃',':bike:':'🚴',':car:':'🚗',':bus:':'🚌',':train:':'🚆',':plane:':'✈️',':boat:':'⛵',':house:':'🏠',':office:':'🏢',':school:':'🏫',':church:':'⛪',':map:':'🗺️',':globe:':'🌍',':moon:':'🌙',':sun:':'☀️',':rain:':'🌧️',':snow:':'❄️',':cloud:':'☁️',':lightning:':'⚡',':rainbow:':'🌈',':dog:':'🐶',':cat:':'🐱',':fish:':'🐟',':bird:':'🐦',':horse:':'🐴',':cow:':'🐮',':pig:':'🐷',':frog:':'🐸',':bee:':'🐝',':butterfly:':'🦋',':snake:':'🐍',':dragon:':'🐉',':unicorn:':'🦄',':cake:':'🎂',':pizza:':'🍕',':burger:':'🍔',':fries:':'🍟',':hotdog:':'🌭',':taco:':'🌮',':sushi:':'🍣',':pasta:':'🍝',':rice:':'🍚',':noodles:':'🍜',':coffee:':'☕',':tea:':'🍵',':beer:':'🍺',':wine:':'🍷',':cocktail:':'🍸',':water:':'💧',':droplet:':'💧',':skull:':'💀',':alien:':'👽',':robot:':'🤖',':poop:':'💩',':ghost:':'👻',':clown:':'🤡',':mask:':'😷',':pill:':'💊',':syringe:':'💉',':lab:':'🔬',':microscope:':'🔬',':telescope:':'🔭',':satellite:':'📡',':antenna:':'📡',':bomb:':'💣',':knife:':'🔪',':shield:':'🛡️',':crown:':'👑',':ring:':'💍',':diamond:':'💎',':gem:':'💎',':trophy:':'🏆',':medal:':'🥇',':book:':'📖',':notebook:':'📓',':newspaper:':'📰',':computer:':'💻',':laptop:':'💻',':mouse:':'🖱️',':printer:':'🖨️',':folder:':'📁',':file:':'📄',':calendar:':'📅',':clock:':'🕐',':alarm:':'⏰',':timer:':'⏱️',':hourglass:':'⌛',':lightbulb:':'💡',':money:':'💰',':chart:':'📊',':graph:':'📈',':magnifier:':'🔍',':search:':'🔍',':tools:':'🔧',':wrench:':'🔧',':screwdriver:':'🪛',':gear:':'⚙️',':chain:':'🔗',':link:':'🔗',':magnet:':'🧲',':flag:':'🚩',':cross:':'⚔️',':medal:':'🎖️',':microphone:':'🎤',':tv:':'📺',':radio:':'📻',':battery:':'🔋',':plug:':'🔌',':lamp:':'💡',':bulb:':'💡',':candle:':'🕯️',':toilet:':'🚽',':shower:':'🚿',':bath:':'🛁',':bed:':'🛏️',':sofa:':'🛋️',':airplane:':'✈️',':helicopter:':'🚁',':ambulance:':'🚑',':police:':'🚓',':firetruck:':'🚒',':tractor:':'🚜',':motorcycle:':'🏍️',':scooter:':'🛴',':skateboard:':'🛹',':surf:':'🏄',':ski:':'⛷️',':snowboarder:':'🏂',':guitar:':'🎸',':drum:':'🥁',':trumpet:':'🎺',':violin:':'🎻',':saxophone:':'🎷',':piano:':'🎹',':email:':'📧',':inbox:':'📥',':outbox:':'📤',':package:':'📦',':shopping:':'🛒',':cart:':'🛒',':credit:':'💳',':bank:':'🏦',':statue:':'🗽',':palm:':'🌴',':cactus:':'🌵',':flower:':'🌸',':rose:':'🌹',':tulip:':'🌷',':sunflower:':'🌻',':herb:':'🌿',':shamrock:':'☘️',':pinetree:':'🌲',':xmas:':'🎄',':santa:':'🎅',':zombie:':'🧟',':vampire:':'🧛',':fairy:':'🧚',':elf:':'🧝',':genie:':'🧞',':mermaid:':'🧜',':angel:':'👼',':baby:':'👶',':boy:':'👦',':girl:':'👧',':man:':'👨',':woman:':'👩',':oldman:':'👴',':oldwoman:':'👵',':police:':'👮',':detective:':'🕵️',':guard:':'💂',':construction:':'👷',':ninja:':'🥷',':prince:':'🤴',':princess:':'👸',':soldier:':'💂',':surgeon:':'🥼',':scientist:':'🥽',':pilot:':'👨‍✈️',':astronaut:':'🧑‍🚀',':firefighter:':'🧑‍🚒',':teacher:':'🧑‍🏫',':judge:':'🧑‍⚖️',':farmer:':'🧑‍🌾',':cook:':'🧑‍🍳',':handshake:':'🤝',':pray:':'🙏',':muscle:':'💪',':fist:':'✊',':raisedhand:':'✋',':victory:':'✌️',':fingerscrossed:':'🤞',':peace:':'☮️',':yin:':'☯️',':recycle:':'♻️',':wheelchair:':'♿',':restroom:':'🚻',':nosmoking:':'🚭',':dog:':'🐕',':cat:':'🐈',':mouse:':'🐁',':hamster:':'🐹',':rabbit:':'🐇',':fox:':'🦊',':bear:':'🐻',':panda:':'🐼',':koala:':'🐨',':tiger:':'🐯',':lion:':'🦁',':monkey:':'🐵',':gorilla:':'🦍',':elephant:':'🐘',':rhino:':'🦏',':bat:':'🦇',':owl:':'🦉',':eagle:':'🦅',':duck:':'🦆',':swan:':'🦢',':peacock:':'🦚',':parrot:':'🦜',':frog:':'🐸',':crocodile:':'🐊',':turtle:':'🐢',':lizard:':'🦎',':snail:':'🐌',':spider:':'🕷️',':scorpion:':'🦂',':crab:':'🦀',':lobster:':'🦞',':shrimp:':'🦐',':squid:':'🦑',':dolphin:':'🐬',':whale:':'🐋',':shark:':'🦈',':octopus:':'🐙',':earth:':'🌍',':saturn:':'🪐',':comet:':'☄️',':star:':'⭐',':sun:':'☀️',':moon:':'🌙',':eclipse:':'🌑',':northernlights:':'🌌',':tornado:':'🌪️',':cyclone:':'🌀',':volcano:':'🌋',':desert:':'🏜️',':island:':'🏝️',':mountain:':'⛰️',':camping:':'🏕️',':beach:':'🏖️',':city:':'🏙️',':sunrise:':'🌅',':sunset:':'🌇',':bridge:':'🌉',':fountain:':'⛲',':tent:':'⛺',':carousel:':'🎠',':ferris:':'🎡',':rollercoaster:':'🎢',':fishing:':'🎣',':bowling:':'🎳',':pool:':'🎱',':dart:':'🎯',':gift:':'🎁',':ribbon:':'🎀',':ticket:':'🎟️',':clapper:':'🎬',':palette:':'🎨',':thread:':'🧵',':yarn:':'🧶',':balloon:':'🎈',':dice:':'🎲',':chess:':'♟️',':jigsaw:':'🧩',':teddy:':'🧸',':kite:':'🪁',':puzzle:':'🧩',':dolls:':'🪆',':glasses:':'👓',':goggles:':'🥽',':hat:':'🎩',':cap:':'🧢',':scarf:':'🧣',':gloves:':'🧤',':coat:':'🧥',':socks:':'🧦',':dress:':'👗',':kimono:':'👘',':sarong:':'🥻',':bikini:':'👙',':swimsuit:':'🩱',':shoe:':'👟',':boot:':'🥾',':sandal:':'👡',':heel:':'👠',':crown:':'👑',':tophat:':'🎩',':graduation:':'🎓',':medal:':'🎖️',':military:':'🎖️',':trophy:':'🏆',':pin:':'📌',':pushpin:':'📌',':paperclip:':'📎',':ruler:':'📏',':scissors:':'✂️',':envelope:':'✉️',':pencil:':'✏️',':pen:':'🖊️',':brush:':'🖌️',':crayon:':'🖍️',':chalk:':'🖍️',':folder:':'📁',':tag:':'🏷️',':barcode:':'🏷️',':qrcode:':'📱',':phone:':'📱',':mobile:':'📱',':tablet:':'📲',':computer:':'💻',':watch:':'⌚',':ring:':'💍',':keyboard:':'⌨️',':mouse:':'🖱️',':trackball:':'🖲️',':printer:':'🖨️',':fax:':'📠',':joystick:':'🕹️',':floppy:':'💾',':cd:':'💿',':dvd:':'📀',':vhs:':'📼',':camera:':'📷',':film:':'🎞️',':projector:':'📽️',':tv:':'📺',':radio:':'📻',':alarm:':'⏰',':stopwatch:':'⏱️',':timer:':'⏲️',':clock:':'🕰️',':thermometer:':'🌡️',':sun:':'☀️',':moon:':'🌙',':cloud:':'☁️',':umbrella:':'☂️',':snowman:':'⛄',':comet:':'☄️',':fire:':'🔥',':droplet:':'💧',':wave:':'🌊',':wind:':'🌬️',':compass:':'🧭',':anchor:':'⚓',':ship:':'🚢',':submarine:':'🛳️',':bridge:':'🌉',':airplane:':'✈️',':helicopter:':'🚁',':rocket:':'🚀',':satellite:':'🛰️',':road:':'🛣️',':railway:':'🛤️',':station:':'🚉',':busstop:':'🚏',':fuel:':'⛽',':parking:':'🅿️',':hospital:':'🏥',':police:':'🚔',':ambulance:':'🚑',':firetruck:':'🚒',':wheel:':'⚙️',':axe:':'🪓',':pick:':'⛏️',':hammer:':'🔨',':saw:':'🪚',':wrench:':'🔧',':screwdriver:':'🪛',':pliers:':'🔧',':ladder:':'🪜',':shovel:':'⛏️',':broom:':'🧹',':soap:':'🧼',':sponge:':'🧽',':toothbrush:':'🪥',':razor:':'🪒',':lotion:':'🧴',':key:':'🔑',':lock:':'🔒',':unlock:':'🔓',':bell:':'🔔',':mute:':'🔕',':loudspeaker:':'📢',':megaphone:':'📣',':postal:':'📮',':postbox:':'📮',':newspaper:':'📰',':bookmark:':'🔖',':link:':'🔗',':gear:':'⚙️',':atom:':'⚛️',':radiation:':'☢️',':biohazard:':'☣️',':recycle:':'♻️',':infinity:':'♾️',':warning:':'⚠️',':pause:':'⏸️',':play:':'▶️',':stop:':'⏹️',':record:':'⏺️',':eject:':'⏏️',':next:':'⏭️',':previous:':'⏮️',':shuffle:':'🔀',':repeat:':'🔁',':repeatone:':'🔂',':arrowup:':'⬆️',':arrowdown:':'⬇️',':arrowleft:':'⬅️',':arrowright:':'➡️',':up:':'🆙',':new:':'🆕',':free:':'🆓',':cool:':'🆒',':top:':'🔝',':soon:':'🔜',':end:':'🔚',':on:':'🔛',':atm:':'🏧',':wc:':'🚾',':passport:':'🛂',':customs:':'🛃',':baggage:':'🛄',':leftluggage:':'🛅',':elevator:':'🛗',':escalator:':'🚈',':stairs:':'🪜',':wheelchair:':'♿',':nosmoking:':'🚭',':dog:':'🐕',':cat:':'🐈',':snake:':'🐍',':dragon:':'🐉',':horse:':'🐎',':bull:':'🐂',':cow:':'🐄',':pig:':'🐖',':ram:':'🐏',':sheep:':'🐑',':goat:':'🐐',':camel:':'🐪',':llama:':'🦙',':giraffe:':'🦒',':elephant:':'🐘',':rhino:':'🦏',':hippo:':'🦛',':mouse:':'🐁',':rat:':'🐀',':hamster:':'🐹',':rabbit:':'🐇',':chipmunk:':'🐿️',':beaver:':'🦫',':hedgehog:':'🦔',':bat:':'🦇',':koala:':'🐨',':panda:':'🐼',':sloth:':'🦥',':otter:':'🦦',':skunk:':'🦨',':kangaroo:':'🦘',':badger:':'🦡',':monkey:':'🐒',':gorilla:':'🦍',':orangutan:':'🦧',':bird:':'🐦',':penguin:':'🐧',':dove:':'🕊️',':eagle:':'🦅',':duck:':'🦆',':swan:':'🦢',':owl:':'🦉',':peacock:':'🦚',':parrot:':'🦜',':frog:':'🐸',':crocodile:':'🐊',':turtle:':'🐢',':lizard:':'🦎',':snail:':'🐌',':spider:':'🕷️',':scorpion:':'🦂',':crab:':'🦀',':lobster:':'🦞',':shrimp:':'🦐',':squid:':'🦑',':octopus:':'🐙',':dolphin:':'🐬',':whale:':'🐋',':shark:':'🦈',':seal:':'🦭',':fish:':'🐟',':tropicalfish:':'🐠',':blowfish:':'🐡',':jellyfish:':'🪼',':coral:':'🪸',':worm:':'🪱',':leaves:':'🍃',':seedling:':'🌱',':palm:':'🌴',':cactus:':'🌵',':flower:':'🌸',':rose:':'🌹',':wilted:':'🥀',':hibiscus:':'🌺',':sunflower:':'🌻',':blossom:':'🌼',':tulip:':'🌷',':herb:':'🌿',':shamrock:':'☘️',':maple:':'🍁',':pine:':'🌲',':xmas:':'🎄',':apple:':'🍎',':pear:':'🍐',':orange:':'🍊',':lemon:':'🍋',':banana:':'🍌',':watermelon:':'🍉',':grapes:':'🍇',':berry:':'🫐',':strawberry:':'🍓',':cherry:':'🍒',':peach:':'🍑',':mango:':'🥭',':pineapple:':'🍍',':melon:':'🍈',':kiwi:':'🥝',':tomato:':'🍅',':eggplant:':'🍆',':avocado:':'🥑',':broccoli:':'🥦',':carrot:':'🥕',':corn:':'🌽',':cucumber:':'🥒',':pepper:':'🫑',':potato:':'🥔',':sweetpotato:':'🍠',':mushroom:':'🍄',':peanuts:':'🥜',':honey:':'🍯',':bread:':'🍞',':croissant:':'🥐',':bagel:':'🥯',':pretzel:':'🥨',':pancake:':'🥞',':waffle:':'🧇',':cheese:':'🧀',':egg:':'🥚',':cooking:':'🍳',':bacon:':'🥓',':pizza:':'🍕',':burger:':'🍔',':fries:':'🍟',':hotdog:':'🌭',':sandwich:':'🥪',':taco:':'🌮',':burrito:':'🌯',':sushi:':'🍣',':rice:':'🍚',':curry:':'🍛',':ramen:':'🍜',':spaghetti:':'🍝',':friedshrimp:':'🍤',':dumpling:':'🥟',':fortune:':'🥠',':takeout:':'🥡',':icecream:':'🍨',':shavedice:':'🍧',':cake:':'🎂',':cupcake:':'🧁',':pie:':'🥧',':chocolate:':'🍫',':candy:':'🍬',':lollipop:':'🍭',':custard:':'🍮',':doughnut:':'🍩',':cookie:':'🍪',':milk:':'🥛',':coffee:':'☕',':tea:':'🍵',':beer:':'🍺',':wine:':'🍷',':cocktail:':'🍸',':tropicaldrink:':'🍹',':champagne:':'🥂',':bottle:':'🍾',':sake:':'🍶',':babybottle:':'🍼',':fork:':'🍴',':knife:':'🔪',':spoon:':'🥄',':chopsticks:':'🥢',':cup:':'🥃',':salad:':'🥗',':popcorn:':'🍿',':salt:':'🧂',':canned:':'🥫',
  };
  const _featureCSS = document.createElement('style');
  _featureCSS.textContent = `
    :root, body {
      --c-bg: #0e1621; --c-surface: #17213b; --c-surface-2: #1e2c3a;
      --c-surface-hover: rgba(255,255,255,0.06); --c-chat-bg: #0e1621;
      --c-border: #0e1621; --c-border-item: #1e2c3a; --c-border-focus: #3390ec;
      --c-text: #ffffff; --c-text-chat: #ffffff; --c-text-meta: #6d8094;
      --c-text-muted: #6d8094; --c-text-name: #ffffff; --c-text-preview: #6d8094;
      --c-sender: #ff8fab; --c-brand: #3390ec; --c-accent: #3390ec;
      --c-accent2: #5b8def; --c-accent5: #5b8def; --c-success: #22c55e;
      --c-sent-bg: #2b5278; --c-sent-border: #2b5278; --c-sent-text: #ffffff;
      --c-received-bg: #182533; --c-received-border: #182533; --c-received-text: #ffffff;
      --c-input-bg: #242f3d; --c-input-border: #242f3d; --c-input-text: #ffffff;
      --c-badge-bg: #1e2c3a; --c-badge-border: #1e2c3a; --c-badge-text: #ffffff;
      --c-btn-ghost-border: #1e2c3a;
      --c-toast-bg: #1c2436; --c-toast-text: #d8d8fd;
      --c-toast-err-bg: #3d1212; --c-toast-err-text: #ffb3b3;
      --c-toast-ok-bg: #14301a; --c-toast-ok-text: #a3ffb3;
      --c-overlay: rgba(0,0,0,0.6);
    }
    body.theme-light {
      --c-bg: #e8ecf1; --c-surface: #ffffff; --c-surface-2: #f0f2f5;
      --c-surface-hover: rgba(0,0,0,0.06); --c-chat-bg: #e8ecf1;
      --c-border: #d6d9de; --c-border-item: #d6d9de; --c-border-focus: #3390ec;
      --c-text: #0f172a; --c-text-chat: #0f172a; --c-text-meta: #475569;
      --c-text-muted: #6b7280; --c-text-name: #0f172a; --c-text-preview: #64748b;
      --c-sender: #e11d48; --c-brand: #7c3aed; --c-accent: #7c3aed;
      --c-sent-bg: #ede9fe; --c-sent-border: #c4b5fd; --c-sent-text: #0f172a;
      --c-received-bg: #ffffff; --c-received-border: #e5e7eb; --c-received-text: #0f172a;
      --c-input-bg: #ffffff; --c-input-border: #e5e7eb; --c-input-text: #0f172a;
      --c-badge-bg: #f1f5f9; --c-badge-border: #e2e8f0; --c-badge-text: #334155;
      --c-btn-ghost-border: #d1d5db;
      --c-toast-bg: #ffffff; --c-toast-text: #111827;
      --c-toast-err-bg: #fef2f2; --c-toast-err-text: #991b1b;
      --c-toast-ok-bg: #f0fdf4; --c-toast-ok-text: #166534;
    }
    body { background: var(--c-bg) !important; color: var(--c-text) !important; transition: background .3s, color .3s; }
    body.theme-light .header, body.theme-light .sidebar, body.theme-light .composer { background: var(--c-surface) !important; border-color: var(--c-border) !important; color: var(--c-text) !important; }
    body.theme-light .chat-main { background: var(--c-chat-bg) !important; }
    body.theme-light .messages { background: var(--c-chat-bg) !important; }
    body.theme-light .item { background: var(--c-surface-2) !important; border-color: var(--c-border-item) !important; color: var(--c-text) !important; }
    body.theme-light .item:hover, body.theme-light .item.active { background: var(--c-surface-hover) !important; border-color: var(--c-border-focus) !important; }
    body.theme-light .input-text { background: var(--c-input-bg) !important; border-color: var(--c-input-border) !important; color: var(--c-input-text) !important; }
    body.theme-light .msg.sent { background: var(--c-sent-bg) !important; border-color: var(--c-sent-border) !important; color: var(--c-sent-text) !important; }
    body.theme-light .msg.received { background: var(--c-received-bg) !important; border-color: var(--c-received-border) !important; color: var(--c-received-text) !important; }
    body.theme-light .meta { color: var(--c-text-meta) !important; }
    body.theme-light .empty-state { color: var(--c-text-meta) !important; background: var(--c-surface) !important; }
    body.theme-light .section-title { color: var(--c-text-muted) !important; }
    body.theme-light .brand h1 { color: var(--c-brand) !important; }
    body.theme-light .header-actions .btn { background: var(--c-surface-2) !important; border-color: var(--c-btn-ghost-border) !important; color: var(--c-text) !important; }
    body.theme-light .toast { background: var(--c-toast-bg) !important; color: var(--c-toast-text) !important; }
    body.theme-light .name { color: var(--c-text-name) !important; }
    body.theme-light .preview { color: var(--c-text-preview) !important; }
    .header { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .brand h1 { color: var(--c-brand) !important; }
    .sidebar { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .section-title { color: var(--c-text-muted) !important; }
    .item { background: var(--c-surface-2) !important; border-color: var(--c-border-item) !important; }
    .item:hover, .item.active { background: var(--c-surface-hover) !important; border-color: var(--c-border-focus) !important; }
    .name { color: var(--c-text-name) !important; }
    .preview { color: var(--c-text-preview) !important; }
    .chat-main { background: var(--c-chat-bg) !important; position: relative; }
    .chat-header { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .chat-title { color: var(--c-text-chat) !important; }
    .chat-meta { color: var(--c-text-muted) !important; }
    .messages { background: var(--c-chat-bg) !important; }
    .msg.sent { background: var(--c-sent-bg) !important; border-color: var(--c-sent-border) !important; color: var(--c-sent-text) !important; }
    .msg.received { background: var(--c-received-bg) !important; border-color: var(--c-received-border) !important; color: var(--c-received-text) !important; }
    .meta { color: var(--c-text-meta) !important; }
    .sender { color: var(--c-sender) !important; }
    .badge { background: var(--c-badge-bg) !important; border-color: var(--c-badge-border) !important; color: var(--c-badge-text) !important; }
    .composer { background: var(--c-surface) !important; border-color: var(--c-border) !important; }
    .input-text { background: var(--c-input-bg) !important; color: var(--c-input-text) !important; border-color: var(--c-input-border) !important; }
    .btn-primary { background: var(--c-sent-bg) !important; color: var(--c-sent-text) !important; border-color: var(--c-accent) !important; }
    .btn-ghost { border-color: var(--c-btn-ghost-border) !important; }
    .toast { background: var(--c-toast-bg) !important; color: var(--c-toast-text) !important; }
    .toast.error { background: var(--c-toast-err-bg) !important; color: var(--c-toast-err-text) !important; }
    .toast.success { background: var(--c-toast-ok-bg) !important; color: var(--c-toast-ok-text) !important; }
    .typing-indicator { color: var(--c-text-muted); font-size:.78rem; min-height:1.1em; display:inline; }
    .msg { position:relative; }
    .reaction-trigger {
      position:absolute; bottom:6px; right:6px; width:22px; height:22px; border-radius:50%;
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
      color:var(--c-text-meta); font-size:13px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity .2s; line-height:1;
    }
    .msg:hover .reaction-trigger { opacity:1; }
    .reaction-trigger:hover { background:rgba(255,255,255,.16); color:var(--c-text); }
    .reaction-badges { display:flex; flex-wrap:wrap; gap:4px; margin-top:5px; }
    .reaction-badge {
      display:inline-flex; align-items:center; gap:2px;
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
      padding:2px 7px; border-radius:10px; font-size:.73rem; cursor:pointer;
      transition:background .15s;
    }
    .reaction-badge:hover { background:rgba(255,255,255,.14); }
    .reaction-badge.reacted { background:rgba(122,59,255,.2); border-color:var(--c-accent); }
    .emoji-picker-popup {
      position:absolute; bottom:calc(100% + 4px); right:0;
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:10px; padding:6px;
      display:flex; gap:2px; flex-wrap:wrap;
      width:196px; z-index:100;
      box-shadow:0 6px 24px rgba(0,0,0,.45);
    }
    .emoji-pick {
      width:32px; height:32px; border:none; background:transparent;
      font-size:18px; cursor:pointer; border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      transition:background .12s;
    }
    .emoji-pick:hover { background:rgba(255,255,255,.1); }
    .msg-actions { display:flex; gap:4px; margin-top:4px; }
    .msg-action-btn {
      background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
      border-radius:6px; padding:2px 7px; cursor:pointer; font-size:11px;
      color:var(--c-text-meta); transition:background .15s, color .15s;
    }
    .msg-action-btn:hover { background:rgba(255,255,255,.14); color:var(--c-text); }
    .edited-tag, .deleted-tag { font-size:.7rem; font-style:italic; color:var(--c-text-muted); margin-top:2px; }
    .drop-overlay {
      position:absolute; inset:0;
      background:rgba(122,59,255,.12); border:2px dashed var(--c-accent);
      border-radius:8px; display:none; align-items:center; justify-content:center;
      z-index:50; pointer-events:none;
    }
    .drop-overlay-content { text-align:center; color:var(--c-accent); font-weight:700; }
    .drop-icon { font-size:48px; margin-bottom:8px; }
    .image-preview { display:flex; gap:8px; padding:4px 0; align-items:flex-end; }
    .img-preview { position:relative; display:inline-block; }
    .img-preview img { max-height:80px; max-width:120px; border-radius:8px; border:1px solid var(--c-border-item); object-fit:cover; }
    .remove-preview {
      position:absolute; top:-6px; right:-6px; width:20px; height:20px;
      border-radius:50%; background:#ef4444; color:#fff; border:none;
      font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center;
      line-height:1;
    }
    .inline-image img { max-width:250px; max-height:200px; border-radius:8px; margin-top:6px; display:block; }
    .modal-overlay {
      position:fixed; inset:0; background:var(--c-overlay);
      display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .modal {
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:16px; padding:24px; width:420px; max-width:92vw;
      display:flex; flex-direction:column; gap:14px; max-height:90vh; overflow:auto;
    }
    .modal h2 { margin:0; color:var(--c-text-chat); }
    .modal label { font-size:.82rem; color:var(--c-text-meta); font-weight:600; display:block; margin-bottom:4px; }
    .modal textarea.input-text { min-height:72px; resize:vertical; }
    .modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:4px; }
    .avatar-upload { display:flex; align-items:center; gap:12px; }
    .avatar-upload img { width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid var(--c-accent); }
    .avatar-placeholder {
      width:64px; height:64px; border-radius:50%;
      background:linear-gradient(135deg,var(--c-accent),var(--c-accent2));
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:1.4rem; color:#fff; flex-shrink:0;
    }
    .theme-wrapper { position:relative; }
    .theme-picker {
      position:absolute; top:calc(100% + 6px); right:0;
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:10px; padding:8px;
      display:none; flex-direction:column; gap:4px;
      z-index:200; min-width:170px;
      box-shadow:0 6px 24px rgba(0,0,0,.45);
    }
    .theme-picker.open { display:flex; }
    .theme-preset {
      display:flex; align-items:center; gap:10px;
      padding:7px 10px; border-radius:8px; border:none;
      background:transparent; color:var(--c-text); cursor:pointer;
      font-size:.84rem; text-align:left; transition:background .12s;
    }
    .theme-preset:hover { background:rgba(255,255,255,.08); }
    .theme-preset.active { background:rgba(122,59,255,.2); }
    .theme-color-dot {
      width:16px; height:16px; border-radius:50%; flex-shrink:0;
      border:2px solid rgba(255,255,255,.2);
    }
    .composer { position:relative; }
    .chat-actions { position:relative; }
    .recording { background:#dc2626 !important; animation:recPulse 1s infinite; }
    @keyframes recPulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
    .voice-msg { display:flex; align-items:center; gap:8px; }
    .voice-msg audio { max-width:220px; height:36px; }
    .reply-bar { display:flex; align-items:center; justify-content:space-between; background:#1a2240; border-left:3px solid #3390ec; padding:8px 12px; border-radius:8px 8px 0 0; font-size:.82rem; color:#9ca3c7; }
    .reply-bar-cancel { background:transparent; border:none; color:#9ca3c7; cursor:pointer; font-size:1rem; padding:2px 6px; }
    .reply-bar-cancel:hover { color:#ffb3b3; }
    .reply-ref { font-size:.72rem; color:#b0b2cc; border-left:3px solid #3390ec; padding:4px 8px; margin-bottom:6px; max-height:44px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; cursor:pointer; border-radius:0 6px 6px 0; background:rgba(51,144,236,.06); transition:background .15s; }
    .reply-ref:hover { background:rgba(122,59,255,.14); }
    .reply-msg-btn { background:transparent; border:none; color:var(--c-text-meta); cursor:pointer; font-size:12px; padding:2px 4px; opacity:0.5; transition:opacity .15s; }
    .reply-msg-btn:hover { opacity:1; }
    .verify-btn { cursor:pointer; }
    .verify-btn.verified { color:var(--c-success) !important; }
    .verify-indicator { display:inline-flex; align-items:center; gap:4px; font-size:.78rem; color:var(--c-success); margin-left:6px; }
    .verify-indicator.unverified { color:var(--c-text-muted); }
    .safety-number-display {
      font-family:monospace; font-size:1.1rem; letter-spacing:1px;
      background:var(--c-surface); border:1px solid var(--c-border-item);
      border-radius:10px; padding:14px 18px; text-align:center;
      color:var(--c-text-chat); line-height:1.8; word-break:break-all;
      user-select:all;
    }
    .safety-number-display .digit-group {
      display:inline-block; margin:0 2px;
      padding:2px 4px; border-radius:4px;
      background:rgba(122,59,255,.08);
    }
    .safety-number-label {
      font-size:.75rem; color:var(--c-text-muted); text-align:center;
      margin-top:4px; font-style:italic;
    }
    .verify-qr-wrap {
      display:flex; justify-content:center; margin:12px 0;
    }
    .verify-qr-wrap canvas { border-radius:10px; border:2px solid var(--c-border-item); }
    .verify-status-badge {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 10px; border-radius:12px; font-size:.75rem; font-weight:600;
    }
    .verify-status-badge.verified { background:rgba(34,197,94,.15); color:var(--c-success); }
    .verify-status-badge.unverified { background:rgba(255,255,255,.06); color:var(--c-text-muted); }
    .verify-actions { display:flex; gap:8px; justify-content:center; margin-top:12px; }
    .verify-step { text-align:center; }
    .verify-step-num { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:var(--c-accent); color:#fff; font-size:.75rem; font-weight:700; margin-bottom:6px; }
    .verify-step-text { font-size:.82rem; color:var(--c-text-meta); margin-bottom:10px; }
    .sidebar .item .verify-icon { font-size:.7rem; margin-left:4px; }
    .read-receipt { font-size:.72rem; font-weight:600; }
    .read-receipt.read { color:var(--c-success); }
    .read-receipt.unread { color:var(--c-text-muted); opacity:.6; }
    .search-results-header { padding:8px 12px; background:var(--c-surface-2); border-bottom:1px solid var(--c-border-item); display:flex; justify-content:space-between; align-items:center; }
    .search-results-header .count { color:var(--c-accent); font-weight:600; font-size:.85rem; }
    .search-results-header .close-search { background:transparent; border:none; color:var(--c-text-meta); cursor:pointer; font-size:1.1rem; }
    .search-results-header .close-search:hover { color:var(--c-text); }
    .file-search-result { display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--c-surface-2); border:1px solid var(--c-border-item); border-radius:8px; margin:4px 0; cursor:pointer; transition:background .15s; }
    .file-search-result:hover { background:var(--c-surface-hover); }
    .file-search-result .file-icon { font-size:1.4rem; }
    .file-search-result .file-info { flex:1; min-width:0; }
    .file-search-result .file-name { font-size:.85rem; color:var(--c-text-chat); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .file-search-result .file-meta { font-size:.72rem; color:var(--c-text-muted); }
    .multi-device-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:10px; font-size:.7rem; background:rgba(122,59,255,.12); color:var(--c-accent); margin-left:6px; }
    .session-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--c-border-item); }
    .session-item:last-child { border-bottom:none; }
    .session-info { flex:1; }
    .session-device { font-size:.85rem; color:var(--c-text-chat); font-weight:600; }
    .session-time { font-size:.72rem; color:var(--c-text-muted); }
    .session-current { font-size:.7rem; color:var(--c-success); }
    .session-revoke { background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:6px; padding:2px 8px; cursor:pointer; font-size:.72rem; }
    .session-revoke:hover { background:rgba(239,68,68,.1); }
    .pinned-bar { display:flex; align-items:center; gap:8px; padding:6px 14px; background:var(--c-surface-2); border-bottom:1px solid var(--c-border-item); cursor:pointer; font-size:.82rem; color:var(--c-text-meta); transition:background .15s; }
    .pinned-bar:hover { background:var(--c-surface-hover); }
    .pinned-bar .pin-icon { font-size:1rem; }
    .pinned-bar .pin-text { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pinned-bar .pin-close { background:transparent; border:none; color:var(--c-text-muted); cursor:pointer; font-size:.9rem; padding:2px 4px; }
    .chat-search-bar { display:flex; align-items:center; gap:6px; padding:6px 12px; background:var(--c-surface-2); border-bottom:1px solid var(--c-border-item); }
    .chat-search-bar .input-text { flex:1; padding:6px 10px; background:var(--c-input-bg); border:1px solid var(--c-input-border); border-radius:8px; color:var(--c-input-text); font-size:.85rem; }
    .chat-search-bar .input-text:focus { outline:none; border-color:var(--c-border-focus); }
    .search-count { font-size:.75rem; color:var(--c-text-muted); white-space:nowrap; }
    .search-highlight { background:rgba(122,59,255,.3); border-radius:2px; padding:0 1px; }
    .disappear-toggle { display:flex; align-items:center; gap:6px; font-size:.78rem; color:var(--c-text-muted); margin-left:8px; }
    .disappear-toggle select { background:var(--c-input-bg); color:var(--c-input-text); border:1px solid var(--c-input-border); border-radius:6px; padding:2px 6px; font-size:.75rem; }
    .schedule-bar { display:flex; align-items:center; gap:6px; padding:6px 12px; background:var(--c-surface-2); border-top:1px solid var(--c-border-item); }
    .schedule-bar input { background:var(--c-input-bg); color:var(--c-input-text); border:1px solid var(--c-input-border); border-radius:6px; padding:3px 8px; font-size:.78rem; flex:1; }
    .schedule-bar .btn { font-size:.75rem; }
    .link-preview-card { margin:6px 0; padding:10px 12px; background:var(--c-surface-2); border:1px solid var(--c-border-item); border-left:3px solid var(--c-accent); border-radius:8px; max-width:360px; }
    .link-preview-card .lp-title { font-size:.85rem; font-weight:600; color:var(--c-text-chat); margin-bottom:3px; }
    .link-preview-card .lp-desc { font-size:.75rem; color:var(--c-text-meta); line-height:1.3; max-height:3em; overflow:hidden; }
    .link-preview-card .lp-url { font-size:.7rem; color:var(--c-text-muted); margin-top:3px; }
    .link-preview-card .lp-image { max-width:100%; max-height:160px; border-radius:6px; margin-top:6px; object-fit:cover; }
    .full-emoji-picker {
      position:absolute; bottom:calc(100% + 4px); left:0;
      background:var(--c-surface-2); border:1px solid var(--c-border-item);
      border-radius:12px; padding:8px; width:320px; max-height:360px;
      display:none; flex-direction:column; z-index:200;
      box-shadow:0 8px 32px rgba(0,0,0,.5);
    }
    .full-emoji-picker.open { display:flex; }
    .emoji-search { width:100%; padding:6px 10px; background:var(--c-input-bg); border:1px solid var(--c-input-border); border-radius:8px; color:var(--c-input-text); font-size:.82rem; margin-bottom:6px; outline:none; }
    .emoji-search:focus { border-color:var(--c-border-focus); }
    .emoji-categories { display:flex; gap:2px; margin-bottom:6px; }
    .emoji-cat-btn { background:transparent; border:none; font-size:1rem; cursor:pointer; padding:3px 6px; border-radius:6px; transition:background .12s; }
    .emoji-cat-btn:hover, .emoji-cat-btn.active { background:rgba(255,255,255,.1); }
    .emoji-grid { display:grid; grid-template-columns:repeat(8,1fr); gap:2px; max-height:250px; overflow-y:auto; }
    .emoji-grid-item { width:100%; aspect-ratio:1; border:none; background:transparent; font-size:1.3rem; cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:background .1s; }
    .emoji-grid-item:hover { background:rgba(255,255,255,.12); }
    .call-record-btn { background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:50%; width:36px; height:36px; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; transition:background .15s; }
    .call-record-btn:hover { background:rgba(239,68,68,.15); }
    .call-record-btn.recording { background:#ef4444; color:#fff; animation:recPulse 1s infinite; }
    .scheduled-list { max-height:200px; overflow:auto; }
    .scheduled-item { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-bottom:1px solid var(--c-border-item); font-size:.82rem; }
    .scheduled-item:last-child { border-bottom:none; }
    .scheduled-text { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--c-text-chat); }
    .scheduled-time { color:var(--c-text-muted); font-size:.72rem; margin:0 8px; }
    [aria-hidden="true"] { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    .skip-link { position:absolute; top:-40px; left:0; background:var(--c-accent); color:#fff; padding:8px 16px; z-index:10000; transition:top .2s; }
    .skip-link:focus { top:0; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    .kbd { display:inline-block; padding:1px 5px; background:var(--c-surface-2); border:1px solid var(--c-border-item); border-radius:4px; font-size:.7rem; font-family:monospace; color:var(--c-text-meta); }
    .folder-tabs { display:flex; gap:0; padding:0 0 8px; overflow-x:auto; border-bottom:1px solid var(--c-border); margin-bottom:8px; }
    .folder-tab { padding:6px 14px; border:none; background:transparent; color:var(--c-text-muted); font-size:.8rem; font-weight:600; cursor:pointer; white-space:nowrap; border-bottom:2px solid transparent; transition:all .2s; }
    .folder-tab.active { color:var(--c-brand); border-bottom-color:var(--c-brand); }
    .folder-tab:hover { color:var(--c-text); }
    .voice-msg-player { display:flex; align-items:center; gap:8px; padding:8px; background:var(--c-surface-2); border-radius:10px; }
    .voice-play-btn { background:var(--c-accent); color:#fff; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:.8rem; flex-shrink:0; }
    .voice-waveform { flex:1; height:40px; border-radius:4px; }
    .voice-duration { font-size:.75rem; color:var(--c-text-muted); min-width:30px; }
    .quick-actions-menu { animation: fadeIn .15s ease; }
    @keyframes fadeIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
    .msg { transition: transform .15s ease, opacity .15s ease; }
    .touching { transition: background .05s; }
  `;
  document.head.appendChild(_featureCSS);

  const _customTheme = localStorage.getItem('customThemeCSS');
  if (_customTheme) {
    const _themeStyle = document.createElement('style');
    _themeStyle.textContent = _customTheme;
    document.head.appendChild(_themeStyle);
  }

  async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
  }

  async function loadJSON(path, opts) {
    const res = await fetch(path, opts);
    if (res.status === 401 && !sessionStorage.getItem('auth-redirecting')) {
      sessionStorage.setItem('auth-redirecting', '1');
      const ret = encodeURIComponent(window.location.pathname + window.location.hash);
      window.location.href = '/login?next=' + ret;
      throw new Error('Ikke innlogget');
    }
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
    return data;
  }

  function toast(message, type = 'error') {
    let container = document.getElementById('toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toasts';
      container.className = 'toasts';
      document.body.appendChild(container);
    }
    const icons = { error: '❌ ', success: '✅ ', info: 'ℹ️ ' };
    const item = document.createElement('div');
    item.className = 'toast ' + type;
    item.textContent = (icons[type] || '') + message;
    item.addEventListener('click', () => item.remove());
    container.appendChild(item);
    setTimeout(() => { if (item.parentElement) item.remove(); }, 2500);
  }

  function showUndoToast(message, undoCallback) {
    let container = document.getElementById('toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toasts';
      container.className = 'toasts';
      document.body.appendChild(container);
    }
    const item = document.createElement('div');
    item.className = 'toast info';
    const span = document.createElement('span');
    span.textContent = message;
    const btn = document.createElement('button');
    btn.className = 'undo-btn';
    btn.textContent = 'Angre';
    btn.addEventListener('click', (e) => { e.stopPropagation(); item.remove(); if (undoCallback) undoCallback(); });
    item.appendChild(span);
    item.appendChild(btn);
    container.appendChild(item);
    setTimeout(() => { if (item.parentElement) item.remove(); }, 5000);
  }

  function deleteMessageWithUndo(msgId, msgEl) {
    const savedHTML = msgEl ? msgEl.innerHTML : null;
    fetch('/messages/' + encodeURIComponent(msgId), { method: 'DELETE' }).then(r => r.json()).then(data => {
      if (data.success) {
        if (msgEl) msgEl.style.opacity = '0.3';
        showUndoToast('Melding slettet', () => {
          fetch('/messages/' + encodeURIComponent(msgId) + '/restore', { method: 'POST' }).then(r => r.json()).then(d => {
            if (d.success && msgEl) { msgEl.style.opacity = '1'; }
          });
        });
      }
    }).catch(() => toast('Kunne ikke slette'));
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  window.scrollToMessage = function(messageId) {
    if (!messageId) return;
    const el = document.querySelector('[data-message-id="' + CSS.escape(messageId) + '"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('msg-highlight');
      setTimeout(() => el.classList.remove('msg-highlight'), 1500);
    }
  };

  function sanitizeWallpaperCss(css) {
    if (!css || typeof css !== 'string') return '';
    if (/url\s*\(/i.test(css) || /expression\s*\(/i.test(css) || /javascript\s*:/i.test(css) || /data\s*:/i.test(css) || /behavior\s*:/i.test(css) || /-moz-binding/i.test(css)) return '';
    const safeProps = /^(background|background-image|color)\s*:/i;
    return css.split(';').filter(p => safeProps.test(p.trim())).join(';');
  }

      function formatTime(iso) {
        try { return new Date(iso).toLocaleString('no-NO'); } catch { return iso; }
      }

      function formatSidebarTime(iso) {
        if (!iso) return '';
        try {
          const d = new Date(iso);
          const now = new Date();
          const diffMs = now - d;
          const diffDays = Math.floor(diffMs / 86400000);
          const time = d.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
          if (diffDays === 0) return time;
          if (diffDays === 1) return 'I går';
          if (diffDays < 7) return d.toLocaleDateString('no-NO', { weekday: 'short' });
          return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' });
        } catch { return ''; }
      }

      function transitionMessages(fn) {
        const box = typeof messagesBox !== 'undefined' ? messagesBox : document.getElementById('messages');
        if (!box || box.children.length === 0) { fn(); return Promise.resolve(); }
        box.classList.add('transitioning');
        return new Promise(resolve => {
          setTimeout(() => { fn(); box.classList.remove('transitioning'); resolve(); }, 160);
        });
      }

      const arrayBufferToBase64 = (buf) => window.__CRYPTO__.arrayBufferToBase64(buf);
      const base64ToArrayBuffer = (b64) => window.__CRYPTO__.base64ToArrayBuffer(b64);

  async function ensureIdentity() {
    try {
      await window.__CRYPTO__.getOrCreateIdentity();
    } catch (e) {
      console.debug('E2EE identity init failed', e);
    }
  }

  async function getPeerPublicKeyPem(user) {
    try {
      const data = await loadJSON('/keys/' + encodeURIComponent(user));
      return data.publicKey || null;
    } catch (e) {
      return null;
    }
  }

  async function encryptForPeer(plaintext, peerPublicKeyPem) {
    if (!peerPublicKeyPem) {
      throw new Error('No public key available for encryption');
    }
    const key = await window.__CRYPTO__.getSharedKey(peerPublicKeyPem);
    const encrypted = await window.__CRYPTO__.encryptMessage(plaintext, key);
    return encrypted.iv + '.' + encrypted.ciphertext;
  }

  async function decryptFromPeer(ciphertext, peerPublicKeyPem) {
    try {
      if (!ciphertext || !peerPublicKeyPem) return ciphertext;
      const parts = String(ciphertext).split('.');
      if (parts.length !== 2) return ciphertext;
      const key = await window.__CRYPTO__.getSharedKey(peerPublicKeyPem);
      const decrypted = await window.__CRYPTO__.decryptMessage({ iv: parts[0], ciphertext: parts[1] }, key);
      return decrypted;
    } catch (e) {
      return '[Kunne ikke dekryptere]';
    }
  }

  const THEME_PRESETS = {
    light: {
      name: 'Light', dot: '#f0f0f0',
      vars: {
        '--c-bg': '#f4f6f9', '--c-surface': '#ffffff', '--c-surface-2': '#f8f9fb',
        '--c-surface-hover': '#f0f2f5', '--c-chat-bg': '#f4f6f9',
        '--c-border': '#e5e7eb', '--c-border-item': '#d1d5db', '--c-border-focus': '#7c3aed',
        '--c-text': '#0f172a', '--c-text-chat': '#1e293b', '--c-text-meta': '#64748b',
        '--c-text-muted': '#94a3b8', '--c-text-name': '#1e293b', '--c-text-preview': '#64748b',
        '--c-sender': '#e11d48', '--c-brand': '#7c3aed', '--c-accent': '#7c3aed',
        '--c-accent2': '#a78bfa', '--c-success': '#16a34a',
        '--c-sent-bg': '#ede9fe', '--c-sent-border': '#7c3aed', '--c-sent-text': '#1e293b',
        '--c-received-bg': '#ffffff', '--c-received-border': '#d1d5db',
        '--c-input-bg': '#ffffff', '--c-input-border': '#d1d5db', '--c-input-text': '#0f172a',
        '--c-badge-bg': '#f3f4f6', '--c-badge-border': '#e5e7eb', '--c-badge-text': '#64748b',
        '--c-btn-ghost-border': '#d1d5db',
      }
    },
    dark: {
      name: 'Dark', dot: '#3390ec',
      vars: {}
    },
    midnight: {
      name: 'Midnight Blue', dot: '#4a9eff',
      vars: {
        '--c-bg': '#0a1628', '--c-surface': '#0d1f3c', '--c-surface-2': '#112847',
        '--c-surface-hover': '#163052', '--c-chat-bg': '#0b1929',
        '--c-border': '#122a45', '--c-border-item': '#1a3555', '--c-border-focus': '#4a9eff',
        '--c-text': '#e0eaff', '--c-text-chat': '#f0f6ff', '--c-text-meta': '#8aafda',
        '--c-text-muted': '#5a8ab5', '--c-text-name': '#d0e4ff', '--c-text-preview': '#7a9fc5',
        '--c-sender': '#ff8fab', '--c-brand': '#64b5f6', '--c-accent': '#4a9eff',
        '--c-accent2': '#7ec8f8', '--c-success': '#4ade80',
        '--c-sent-bg': '#0d2a4a', '--c-sent-border': '#4a9eff', '--c-sent-text': '#f0f6ff',
        '--c-received-bg': '#0f2035', '--c-received-border': '#1e4060',
        '--c-input-bg': '#081420', '--c-input-border': '#1a3555', '--c-input-text': '#e0eaff',
        '--c-badge-bg': '#112847', '--c-badge-border': '#1e4060', '--c-badge-text': '#c0daf0',
        '--c-btn-ghost-border': '#1e4060',
      }
    },
    forest: {
      name: 'Forest', dot: '#4caf50',
      vars: {
        '--c-bg': '#0a120a', '--c-surface': '#132413', '--c-surface-2': '#1a331a',
        '--c-surface-hover': '#204020', '--c-chat-bg': '#0e180e',
        '--c-border': '#1a2e1a', '--c-border-item': '#224022', '--c-border-focus': '#4caf50',
        '--c-text': '#e0f0e0', '--c-text-chat': '#f0fff0', '--c-text-meta': '#8ab88a',
        '--c-text-muted': '#5a8a5a', '--c-text-name': '#c0e8c0', '--c-text-preview': '#7aaa7a',
        '--c-sender': '#ff8fab', '--c-brand': '#66bb6a', '--c-accent': '#4caf50',
        '--c-accent2': '#81c784', '--c-success': '#66bb6a',
        '--c-sent-bg': '#1a3a1a', '--c-sent-border': '#4caf50', '--c-sent-text': '#f0fff0',
        '--c-received-bg': '#152a15', '--c-received-border': '#2a4a2a',
        '--c-input-bg': '#0a140a', '--c-input-border': '#224022', '--c-input-text': '#e0f0e0',
        '--c-badge-bg': '#1a331a', '--c-badge-border': '#2a4a2a', '--c-badge-text': '#b0d8b0',
        '--c-btn-ghost-border': '#2a4a2a',
      }
    },
    sunset: {
      name: 'Sunset', dot: '#ff6b35',
      vars: {
        '--c-bg': '#1a0a0a', '--c-surface': '#2d1414', '--c-surface-2': '#3d1c1c',
        '--c-surface-hover': '#4d2424', '--c-chat-bg': '#201010',
        '--c-border': '#3a1e1e', '--c-border-item': '#4a2828', '--c-border-focus': '#ff6b35',
        '--c-text': '#ffe8e0', '--c-text-chat': '#fff4ee', '--c-text-meta': '#cc9080',
        '--c-text-muted': '#aa6a5a', '--c-text-name': '#ffd8c8', '--c-text-preview': '#bb8070',
        '--c-sender': '#ff8fab', '--c-brand': '#ff8a65', '--c-accent': '#ff6b35',
        '--c-accent2': '#ffab91', '--c-success': '#4ade80',
        '--c-sent-bg': '#3d1c1c', '--c-sent-border': '#ff6b35', '--c-sent-text': '#fff4ee',
        '--c-received-bg': '#2a1515', '--c-received-border': '#4a2828',
        '--c-input-bg': '#1a0808', '--c-input-border': '#4a2828', '--c-input-text': '#ffe8e0',
        '--c-badge-bg': '#3d1c1c', '--c-badge-border': '#4a2828', '--c-badge-text': '#ddc0b0',
        '--c-btn-ghost-border': '#4a2828',
      }
    },
    ocean: {
      name: 'Ocean', dot: '#00bcd4',
      vars: {
        '--c-bg': '#041520', '--c-surface': '#0a2333', '--c-surface-2': '#0e2d40',
        '--c-surface-hover': '#12374d', '--c-chat-bg': '#061a28',
        '--c-border': '#0e2a3a', '--c-border-item': '#143548', '--c-border-focus': '#00bcd4',
        '--c-text': '#e0f4f8', '--c-text-chat': '#f0fafe', '--c-text-meta': '#80b8cc',
        '--c-text-muted': '#5090a8', '--c-text-name': '#c0eaf4', '--c-text-preview': '#70a8c0',
        '--c-sender': '#ff8fab', '--c-brand': '#4dd0e1', '--c-accent': '#00bcd4',
        '--c-accent2': '#80deea', '--c-success': '#4ade80',
        '--c-sent-bg': '#0e2d40', '--c-sent-border': '#00bcd4', '--c-sent-text': '#f0fafe',
        '--c-received-bg': '#0a2230', '--c-received-border': '#143548',
        '--c-input-bg': '#041218', '--c-input-border': '#143548', '--c-input-text': '#e0f4f8',
        '--c-badge-bg': '#0e2d40', '--c-badge-border': '#143548', '--c-badge-text': '#b0dce8',
        '--c-btn-ghost-border': '#143548',
      }
    },
    nord: {
      name: 'Nord', dot: '#88c0d0',
      vars: {
        '--c-bg': '#2e3440', '--c-surface': '#3b4252', '--c-surface-2': '#434c5e',
        '--c-surface-hover': '#4c566a', '--c-chat-bg': '#333a47',
        '--c-border': '#3b4252', '--c-border-item': '#434c5e', '--c-border-focus': '#88c0d0',
        '--c-text': '#eceff4', '--c-text-chat': '#eceff4', '--c-text-meta': '#a0aabe',
        '--c-text-muted': '#7b88a0', '--c-text-name': '#d8dee9', '--c-text-preview': '#90a0b8',
        '--c-sender': '#bf616a', '--c-brand': '#81a1c1', '--c-accent': '#88c0d0',
        '--c-accent2': '#8fbcbb', '--c-success': '#a3be8c',
        '--c-sent-bg': '#434c5e', '--c-sent-border': '#88c0d0', '--c-sent-text': '#eceff4',
        '--c-received-bg': '#3b4252', '--c-received-border': '#4c566a',
        '--c-input-bg': '#2e3440', '--c-input-border': '#4c566a', '--c-input-text': '#eceff4',
        '--c-badge-bg': '#434c5e', '--c-badge-border': '#4c566a', '--c-badge-text': '#c0cce0',
        '--c-btn-ghost-border': '#4c566a',
      }
    }
  };

  async function init() {
    if (!window.__APP__?.username) return;
    try {
      // ── Animated background ──
      (function initParticles() {
        const bg = document.createElement('div');
        bg.className = 'particle-bg';
        document.body.insertBefore(bg, document.body.firstChild);
        for (let i = 0; i < 20; i++) {
          const p = document.createElement('div');
          p.className = 'p';
          const size = 2 + Math.random() * 4;
          p.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (Math.random() * 100) + '%;animation-duration:' + (15 + Math.random() * 25) + 's;animation-delay:' + (Math.random() * 20) + 's;';
          bg.appendChild(p);
        }
      })();

      await ensureIdentity();
      const [usersRes, groupsRes] = await Promise.all([
        fetch('/users/all'),
        fetch('/groups')
      ]);
      const usersData = await safeJson(usersRes);
      const groupsData = await safeJson(groupsRes);
      const users = usersData.users || [];
      window.__allUsers = users || [];
      const groups = groupsData.groups || [];
      window.__allGroups = groups || [];

      const app = document.getElementById('app');
      if (!app) throw new Error('Missing #app');

      app.innerHTML = `
        <header class="header">
          <div class="header-left">
            <button id="mobileBackBtn" class="back-btn" style="display:none" aria-label="Tilbake">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 class="brand">CryptoChat</h1>
            <span id="onlineStatus" class="online-status"></span>
            <button id="logoutBtn" class="btn btn-small btn-ghost">Logg ut</button>
          </div>
          <div class="header-actions">
            <button id="adminBtn" class="btn btn-small btn-ghost" style="display:none">⚙️ Admin</button>
            <button id="remindersBtn" class="btn btn-small btn-ghost" title="Påminnelser" aria-label="Påminnelser">⏰</button>
            <button id="profileBtn" class="btn btn-small btn-ghost">Min profil</button>
            <button id="audioCallBtn" class="btn btn-small btn-primary" title="Lydsamtale">📞</button>
            <button id="videoCallBtn" class="btn btn-small btn-primary" title="Videosamtale">📹</button>
            <div class="theme-wrapper">
              <button id="themeBtn" class="btn btn-small btn-ghost">Tema</button>
              <div id="themePicker" class="theme-picker"></div>
            </div>
            <button id="fa2Btn" class="btn btn-small btn-ghost" aria-label="Tofaktorautentisering">2FA</button>
            <button id="sessionsBtn" class="btn btn-small btn-ghost" aria-label="Administrer enheter">Enheter</button>
            <button id="rotateKeyBtn" class="btn btn-small btn-ghost" title="Roter.noekkel" aria-label="Roter krypteringsnoekkel">🔄</button>
            <button id="lockToggle" class="btn btn-small btn-ghost" title="App-lås">🔐</button>
            <button id="stealthToggle" class="btn btn-small btn-ghost" title="Stealth-modus">👁️</button>
            <button id="globalSearchBtn" class="btn btn-small btn-ghost" title="Globalt søk">🔍</button>
            <button id="aiSummaryBtn" class="btn btn-small btn-ghost" title="AI-sammendrag">🤖</button>
          </div>
        </header>
        <div class="app-row">
          <aside class="sidebar" role="navigation" aria-label="Kontakter">
            <div class="sidebar-search">
              <svg class="sidebar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input id="sidebarSearch" class="sidebar-search-input" type="text" placeholder="Soek" autocomplete="off" aria-label="Soek i kontakter" />
            </div>
            <div id="folderTabs" class="folder-tabs" role="tablist"></div>
            <button id="folderEditBtn" class="btn btn-small btn-ghost" title="Rediger mapper" style="margin: 0 12px 6px;font-size:.78rem;">✎ Mapper</button>
            <div class="section">
              <div class="section-title">MELDINGER</div>
              <div id="savedMsgItem" class="item saved-messages-item" role="option" tabindex="0" aria-label="Lagrede meldinger" style="cursor:pointer;margin-bottom:6px;">
                <div class="avatar-wrap"><div class="avatar" style="background:linear-gradient(135deg,#3390ec,#5b8def);">📌</div></div>
                <div><div class="name">Lagrede meldinger</div><div class="preview">Dine notater og bokmerker</div></div>
              </div>
              <div id="usersList" class="list" role="listbox" aria-label="Kontakter"></div>
            </div>
            <div class="section">
              <div class="section-title">GRUPPER</div>
              <div id="groupsList" class="list" role="listbox" aria-label="Grupper"></div>
              <button id="createGroupBtn" class="btn btn-small btn-ghost" aria-label="Opprett ny gruppe">+ Ny gruppe</button>
            </div>
            <div class="section" id="archiveSection" style="display:none">
              <div class="section-title">ARKIV</div>
              <div id="archivedList" class="list" role="listbox" aria-label="Arkiverte samtaler"></div>
            </div>
            <div class="section">
              <div class="section-title">KANALER</div>
              <div id="channelsList" class="list" role="listbox" aria-label="Kanaler"></div>
            </div>
          </aside>
          <main class="chat-main" role="main">
            <header class="chat-header" role="banner">
              <div class="chat-title-wrap">
                <button id="chatBackBtn" class="back-btn" aria-label="Tilbake" style="display:none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                </button>
                <div id="chatTitle" class="chat-title" aria-live="polite">Velg en samtale</div>
                <div id="chatMeta" class="chat-meta" aria-live="polite"></div>
              </div>
              <div id="selectionToolbar" class="selection-toolbar" style="display:none">
                <button id="selDeleteBtn" class="btn btn-small btn-ghost" title="Slett valgte">🗑️</button>
                <button id="selForwardBtn" class="btn btn-small btn-ghost" title="Videresend">↪</button>
                <button id="selCancelBtn" class="btn btn-small btn-ghost" title="Avbryt">✕</button>
                <span id="selCount" class="sel-count"></span>
              </div>
              <div class="chat-actions">
                <input id="searchPartner" class="input-text" placeholder="Kontakt for soek" autocomplete="off" aria-label="Soek paa kontakt" />
                <input id="searchInput" class="input-text" placeholder="Soek i meldinger..." autocomplete="off" aria-label="Soek i meldinger" />
                <input id="searchDateFrom" type="date" class="input-text" style="width:130px;font-size:.8rem;" aria-label="Fra dato" />
                <input id="searchDateTo" type="date" class="input-text" style="width:130px;font-size:.8rem;" aria-label="Til dato" />
                <button id="searchBtn" class="btn btn-small btn-ghost" aria-label="Soek">Soek</button>
                <button id="fileSearchBtn" class="btn btn-small btn-ghost" title="Soek i filer" aria-label="Soek i filer">📎</button>
                <button id="myKeyBtn" class="btn btn-small btn-ghost" aria-label="Vis min offentlige noekkel">Min noekkel</button>
                <button id="verifyBtn" class="btn btn-small btn-ghost verify-btn" style="display:none" title="Sikkerhetsnummer" aria-label="Verifiser samtale">🛡️</button>
                <button id="exportBtn" class="btn btn-small btn-ghost" title="Eksporter samtale" aria-label="Eksporter chat" style="display:none">💾</button>
                <button id="threadSummaryBtn" class="btn btn-small btn-ghost" title="Oppsummer samtale med AI" aria-label="Oppsummer samtale med AI" style="display:none">📝</button>
                <button id="folderSuggestBtn" class="btn btn-small btn-ghost" title="Foreslå mappe med AI" aria-label="Foreslå mappe med AI" style="display:none">📁✨</button>
                <button id="wallpaperBtn" class="btn btn-small btn-ghost" title="Bakgrunn" aria-label="Velg bakgrunn" style="display:none">🖼️</button>
                <button id="muteBtn" class="btn btn-small btn-ghost" title="Demp varsler" style="display:none">🔔</button>
                <button id="chatSearchBtn" class="btn btn-small btn-ghost" title="Soek i chat" aria-label="Soek i chat" style="display:none">🔍</button>
                <button id="inviteBtn" class="btn btn-small btn-ghost" title="Del invitasjon" style="display:none" aria-label="Del gruppeinvitasjon">🔗</button>
                <button id="lockBtn" class="btn btn-small btn-ghost" title="E2EE-status" style="display:none" aria-label="Krypteringsstatus">🔓</button>
                <button id="groupAdminBtn" class="btn btn-small btn-ghost" title="Gruppeinnstillinger" aria-label="Gruppeinnstillinger" style="display:none">⚙️</button>
              </div>
            </header>
            <div id="pinnedBar" class="pinned-bar" style="display:none" role="button" tabindex="0" aria-label="Fast melding">
              <span class="pin-icon">📌</span>
              <span class="pin-text" id="pinnedText"></span>
              <button id="pinnedClose" class="btn btn-small btn-ghost" title="Fjern" style="margin-left:auto;">✕</button>
            </div>
            <div id="chatSearchBar" class="chat-search-bar" style="display:none">
              <input id="chatSearchInput" type="text" class="input-text" placeholder="Soek i denne samtalen..." aria-label="Soek i chat" />
              <span id="chatSearchCount" class="search-count"></span>
              <button id="chatSearchPrev" class="btn btn-small btn-ghost" title="Forrige">⬆</button>
              <button id="chatSearchNext" class="btn btn-small btn-ghost" title="Neste">⬇</button>
              <button id="chatSearchClose" class="btn btn-small btn-ghost" title="Lukk soek">✕</button>
            </div>
            <div id="messages" class="messages" role="log" aria-live="polite" aria-label="Meldinger">
              <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>Ingen samtale valgt</h3>
                <p>Velg en kontakt eller gruppe.</p>
              </div>
            </div>
            <div id="dropOverlay" class="drop-overlay" aria-hidden="true">
              <div class="drop-overlay-content">
                <div class="drop-icon">📁</div>
                <div>Slipp fil her</div>
              </div>
            </div>
            <div id="composer" class="composer" style="display:none" role="form" aria-label="Meldingskomposisjon">
              <div id="imagePreview" class="image-preview" style="display:none"></div>
              <input id="fileInput" type="file" class="input-text" aria-label="Velg fil" />
              <div id="replyBar" class="reply-bar" style="display:none" aria-live="polite">
                <span class="reply-bar-text">Svarer paa: <strong id="replyBarName"></strong> <span id="replyBarPreview"></span></span>
                <button id="cancelReply" class="reply-bar-cancel" aria-label="Avbryt svar">&#10005;</button>
              </div>
              <div class="composer-row" style="position:relative">
                <button id="emojiToggleBtn" class="btn btn-small btn-ghost" title="Emoji" aria-label="Velg emoji">😀</button>
                <button id="stickerBtn" class="btn btn-small btn-ghost" title="Stickers/GIFs" aria-label="Stickers og GIFs">🎨</button>
                <div id="stickerPicker" class="sticker-picker" role="dialog" aria-label="Sticker-velger">
                  <div id="stickerTabs" class="sticker-tabs"></div>
                  <div id="stickerContent" class="sticker-grid"></div>
                </div>
                <div id="fullEmojiPicker" class="full-emoji-picker" role="dialog" aria-label="Emoji-velger">
                  <input id="emojiSearch" class="emoji-search" placeholder="Soek emoji..." aria-label="Soek emoji" />
                  <div id="emojiCategories" class="emoji-categories"></div>
                  <div id="emojiGrid" class="emoji-grid" role="grid" aria-label="Emoji"></div>
                </div>
                <input id="messageInput" class="input-text" placeholder="Skriv en melding... (skriv /ai for å spørre AI)" autocomplete="off" aria-label="Skriv en melding" />
                <button id="voiceRecordBtn" class="btn btn-small btn-ghost" title="Talebeskjed" aria-label="Talebeskjed">🎙️</button>
                <button id="dictateBtn" class="btn btn-small btn-ghost" title="Tale-til-tekst (diktat)" aria-label="Tale-til-tekst">🎤</button>
                <button id="videoRecordBtn" class="btn btn-small btn-ghost" title="Videomelding" aria-label="Videomelding">📹</button>
                <button id="locationBtn" class="btn btn-small btn-ghost" title="Del posisjon" aria-label="Del posisjon">📍</button>
                <button id="templateBtn" class="btn-attach" title="Maler" style="font-size:1rem;">📋</button>
                <button id="aiRepliesBtn" class="btn btn-small btn-ghost" title="Foreslå svar med AI" aria-label="Foreslå svar med AI">✨</button>
                <button id="pollBtn" class="btn btn-small btn-ghost" title="Opprett avstemning" aria-label="Opprett avstemning" style="display:none">📊</button>
                <span id="silentToggle" class="silent-toggle" title="Lydløs melding" aria-label="Lydløs melding">🔇</span>
                <span style="position:relative;">
                  <button id="effectBtn" class="btn btn-small btn-ghost" title="Meldingseffekt" aria-label="Meldingseffekt">✨</button>
                  <div id="effectPicker" class="effect-picker">
                    <button data-effect="confetti" title="Konfetti">🎉</button>
                    <button data-effect="hearts" title="Hjerter">❤️</button>
                    <button data-effect="fireworks" title="Fyrverkeri">🎆</button>
                    <button data-effect="snow" title="Snø">❄️</button>
                    <button data-effect="stars" title="Stjerner">⭐</button>
                  </div>
                </span>
                <button id="scheduleBtn" class="btn btn-small btn-ghost" title="Planlegg melding" aria-label="Planlegg melding">⏰</button>
                <button id="sendBtn" class="btn btn-primary" disabled aria-label="Send melding"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
              </div>
              <div id="scheduleBar" class="schedule-bar" style="display:none">
                <span style="font-size:.78rem;color:var(--c-text-muted)">📅</span>
                <input id="scheduleTime" type="datetime-local" aria-label="Send senere" />
                <button id="scheduleSendBtn" class="btn btn-small btn-primary">Planlegg</button>
                <button id="scheduleCancelBtn" class="btn btn-small btn-ghost">✕</button>
              </div>
            </div>
          </main>
        </div>
      `;

      var usersList = document.getElementById('usersList');
      var groupsList = document.getElementById('groupsList');
      var chatTitle = document.getElementById('chatTitle');
      var chatMeta = document.getElementById('chatMeta');
      var messagesBox = document.getElementById('messages');
      var composer = document.getElementById('composer');
      var dropOverlay = document.getElementById('dropOverlay');
      var imagePreview = document.getElementById('imagePreview');

      let activeChat = null;
      let replyingTo = null;

      let userScrolledUp = false;
      let lastMessages = {};
      let groupLastMessages = {};
      let lastMessageData = { users: {}, groups: {} };
      // ── WebRTC Call state ──
      let currentCall = null;
      let peerConnection = null;
      let localStream = null;
      let callPollInterval = null;
      let _iceServers = null;
      async function getIceServers() {
        if (_iceServers) return _iceServers;
        const servers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];
        try {
          const res = await fetch('/webrtc/turn', {credentials:'same-origin'});
          const data = await res.json();
          if (data.url && data.user && data.pass) {
            servers.push({ urls: data.url, username: data.user, credential: data.pass });
          }
        } catch (e) {}
        _iceServers = { iceServers: servers };
        return _iceServers;
      }
      let presence = {};
      const onlineUsers = new Set();
      window.__onlineUsers = onlineUsers;
      let sendOnEnter = localStorage.getItem('sendOnEnter') !== 'false';
      let typingTimeout = null;
      let isTyping = false;
      let knownMessageIds = new Set();
      let firstLoadPerChat = new Set();
      let chatLoadState = {};
      let userProfiles = {};
      let currentTheme = localStorage.getItem('chat-theme') || window.__APP__?.theme || 'dark';
      let droppedFile = null;
      let verificationStatuses = {};
      let unreadCounts = {};
      let _notificationAudio = null;
      window.__lastSeenTimes = {};
      let currentFolder = 'all';
      let chatFolders = [];
      let archivedChats = [];
      const selectedMessages = new Set();
      let selectionMode = false;
      let pinnedChats = [];
      let mutedChats = [];
      let blockedUsers = [];
      let chatNotifOverrides = {};
      let channels = [];
      let chatLabels = {};

      async function loadLabels() {
        try {
          const data = await loadJSON('/labels');
          chatLabels = data.labels || {};
        } catch(e) { chatLabels = {}; }
      }

      async function saveLabel(chatId, label) {
        try {
          const data = await loadJSON('/labels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, label }) });
          if (data.success) {
            chatLabels[chatId] = data.labels;
          }
        } catch(e) {}
      }

      async function fetchVerificationStatus(username) {
        try {
          const data = await loadJSON('/verify/status/' + encodeURIComponent(username));
          verificationStatuses[username] = data.verified || false;
          return data.verified || false;
        } catch { return false; }
      }

      async function fetchBatchVerification(usernames) {
        try {
          const data = await loadJSON('/verify/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: usernames })
          });
          if (data.statuses) Object.assign(verificationStatuses, data.statuses);
        } catch {}
      }

      function formatSafetyNumber(digits) {
        if (!digits) return '';
        const groups = [];
        for (let i = 0; i < digits.length; i += 5) {
          groups.push('<span class="digit-group">' + escapeHtml(digits.slice(i, i + 5)) + '</span>');
        }
        return groups.join(' ');
      }

      function generateQRCode(text, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const modules = generateQRMatrix(text);
        const moduleCount = modules.length;
        const cellSize = size / (moduleCount + 8);
        const offset = cellSize * 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (modules[r][c]) {
              ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }
        return canvas;
      }

      function generateQRMatrix(text) {
        const data = [];
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i);
          if (charCode < 128) data.push(charCode);
          else if (charCode < 2048) { data.push(192 | (charCode >> 6)); data.push(128 | (charCode & 63)); }
          else { data.push(224 | (charCode >> 12)); data.push(128 | ((charCode >> 6) & 63)); data.push(128 | (charCode & 63)); }
        }
        const mode = 4;
        const ecLevel = 1;
        const version = Math.max(1, Math.min(10, Math.ceil((data.length + 10) / 30)));
        const size = 17 + version * 4;
        const matrix = Array.from({ length: size }, () => Array(size).fill(false));
        const reserved = Array.from({ length: size }, () => Array(size).fill(false));
        for (let i = 0; i < 8; i++) {
          setModule(matrix, reserved, 0, i, i < 6);
          setModule(matrix, reserved, i, 0, i < 6);
          setModule(matrix, reserved, size - 1 - i, 0, i < 6);
          setModule(matrix, reserved, 0, size - 1 - i, i < 6);
          setModule(matrix, reserved, size - 7 + i, 0, false);
          setModule(matrix, reserved, 0, size - 7 + i, false);
        }
        for (let i = 8; i < size - 8; i++) {
          setModule(matrix, reserved, 6, i, i % 2 === 0);
          setModule(matrix, reserved, i, 6, i % 2 === 0);
        }
        let bitIndex = 0;
        const allBits = [];
        allBits.push(1, 0, 0, 0);
        const dataLength = data.length;
        for (let i = 7; i >= 0; i--) allBits.push((dataLength >> i) & 1);
        for (const byte of data) {
          for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
        }
        while (allBits.length < (size * size * 2)) allBits.push(0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1);
        let bitPos = 0;
        for (let right = size - 1; right >= 1; right -= 2) {
          if (right === 6) right = 5;
          for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
              const col = right - j;
              const row = ((Math.floor((size - 1 - right) / 2)) % 2 === 0) ? size - 1 - vert : vert;
              if (!reserved[row][col] && bitPos < allBits.length) {
                matrix[row][col] = !!allBits[bitPos];
                bitPos++;
              }
            }
          }
        }
        return matrix;
      }

      function setModule(matrix, reserved, row, col, value) {
        if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
          matrix[row][col] = value;
          reserved[row][col] = true;
        }
      }

      function showSafetyNumberModal(username) {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal" style="max-width:460px">'
          + '<h2>Sikkerhetsnummer</h2>'
          + '<div class="verify-step"><div class="verify-step-num">1</div>'
          + '<div class="verify-step-text">Sammenlign sikkerhetsnummeret med ' + escapeHtml(getDisplayName(username)) + '</div></div>'
          + '<div id="safetyNumberContent" style="text-align:center;color:var(--c-text-muted);">Laster...</div>'
          + '<div id="verifyStatusBadge"></div>'
          + '<div class="verify-actions">'
          + '<button id="verifyToggleBtn" class="btn btn-primary"></button>'
          + '<button id="verifyCloseBtn" class="btn btn-ghost">Lukk</button>'
          + '</div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#verifyCloseBtn').addEventListener('click', () => overlay.remove());

        loadJSON('/verify/safety-number/' + encodeURIComponent(username)).then(data => {
          const content = overlay.querySelector('#safetyNumberContent');
          const badge = overlay.querySelector('#verifyStatusBadge');
          const toggleBtn = overlay.querySelector('#verifyToggleBtn');
          if (!data.success) {
            content.innerHTML = '<p style="color:var(--c-text-muted)">' + escapeHtml(data.message || 'Kunne ikke hente sikkerhetsnummer') + '</p>';
            return;
          }
          const qrCanvas = generateQRCode(data.safetyNumber, 180);
          content.innerHTML = '<div class="verify-qr-wrap"></div>'
            + '<div class="safety-number-display">' + formatSafetyNumber(data.safetyNumber) + '</div>'
            + '<div class="safety-number-label">Sikkerhetsnummer for ' + escapeHtml(getDisplayName(data.usernameA)) + ' &harr; ' + escapeHtml(getDisplayName(data.usernameB)) + '</div>';
          content.querySelector('.verify-qr-wrap').appendChild(qrCanvas);

          if (data.verified) {
            badge.innerHTML = '<span class="verify-status-badge verified">✓ Verifisert' + (data.verifiedAt ? ' — ' + formatTime(data.verifiedAt) : '') + '</span>';
            toggleBtn.textContent = 'Fjern verifisering';
            toggleBtn.className = 'btn btn-ghost';
          } else {
            badge.innerHTML = '<span class="verify-status-badge unverified">Ikke verifisert</span>';
            toggleBtn.textContent = 'Jeg har verifisert';
            toggleBtn.className = 'btn btn-primary';
          }

          toggleBtn.addEventListener('click', async () => {
            try {
              if (data.verified) {
                await loadJSON('/verify/' + encodeURIComponent(username), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                toast('Verifisering fjernet', 'success');
              } else {
                await loadJSON('/verify/' + encodeURIComponent(username), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                toast('Samtale verifisert', 'success');
              }
              await fetchVerificationStatus(username);
              updateVerifyButton();
              overlay.remove();
            } catch (e) {
              toast('Kunne ikke oppdatere verifisering');
            }
          });
        }).catch(() => {
          overlay.querySelector('#safetyNumberContent').innerHTML = '<p style="color:var(--c-text-muted)">Kunne ikke hente sikkerhetsnummer</p>';
        });
      }

      function updateVerifyButton() {
        const btn = document.getElementById('verifyBtn');
        if (!btn) return;
        if (activeChat && activeChat.type === 'user') {
          btn.style.display = '';
          const verified = verificationStatuses[activeChat.target] || false;
          btn.classList.toggle('verified', verified);
          btn.title = verified ? 'Verifisert — klikk for å se sikkerhetsnummer' : 'Verifiser samtale';
        } else {
          btn.style.display = 'none';
        }
        if (activeChat && activeChat.type === 'user') {
          const meta = document.getElementById('chatMeta');
          const existingIndicator = meta.querySelector('.verify-indicator');
          if (existingIndicator) existingIndicator.remove();
          const verified = verificationStatuses[activeChat.target] || false;
          const indicator = document.createElement('span');
          indicator.className = 'verify-indicator' + (verified ? '' : ' unverified');
          indicator.textContent = verified ? '🛡️ Verifisert' : '';
          if (verified) meta.insertBefore(indicator, meta.firstChild);
        }
      }

      async function updateE2EEStatus() {
        const inviteBtn = document.getElementById('inviteBtn');
        const lockBtn = document.getElementById('lockBtn');
        if (!lockBtn) return;
        let html = window.__CRYPTO__ ? '🔒' : '🔓';
        if (activeChat) {
          if (activeChat.type === 'user' && window.__CRYPTO__) {
            html = '🔒';
            lockBtn.style.display = '';
          } else if (activeChat.type === 'group' && activeChat.groupE2EEKey) {
            html = '🔒';
            lockBtn.style.display = '';
          } else {
            lockBtn.style.display = 'none';
          }
        } else {
          lockBtn.style.display = 'none';
        }
        lockBtn.textContent = html;
        if (inviteBtn) inviteBtn.style.display = 'none';
        if (lockBtn && activeChat && activeChat.type === 'group') {
          const group = groups.find(g => g.id === activeChat.target) || {};
          if (group.invite_token || (group.members || []).length) {
            if (inviteBtn) inviteBtn.style.display = '';
          } else {
            if (inviteBtn) inviteBtn.style.display = 'none';
          }
        }
      }

      document.getElementById('lockBtn').addEventListener('click', () => {
        if (!activeChat || !document.getElementById('lockBtn').textContent.includes('🔒')) return;
        toast(activeChat.type === 'group' ? 'Gruppe er ende-til-ende-kryptert' : 'Dette er en kryptert samtale');
      });

      document.getElementById('inviteBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'group') return;
        const inviteBtn = document.getElementById('inviteBtn');
        try {
          const res = await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          });
          const data = await safeJson(res);
          if (data && data.success && data.invite_url) {
            await navigator.clipboard.writeText(data.invite_url).catch(() => {});
            inviteBtn.textContent = '✅';
            inviteBtn.title = 'Invitasjonslenke kopiert';
            toast('Invitasjonslenke kopiert');
            setTimeout(() => { inviteBtn.textContent = '🔗'; inviteBtn.title = 'Del invitasjon'; }, 2500);
          } else {
            toast(data && data.message ? data.message : 'Kunne ikke opprette invitasjon');
          }
        } catch (e) {
          toast('Kunne ikke opprette invitasjon');
        }
      });

      document.getElementById('verifyBtn').addEventListener('click', () => {
        if (activeChat && activeChat.type === 'user') {
          showSafetyNumberModal(activeChat.target);
        }
      });

      function getDisplayName(username) {
        const p = userProfiles[username];
        if (p && p.display_name) return p.display_name;
        return username;
      }

      function setChatMeta(e2eeHtml) {
        chatMeta.innerHTML = (e2eeHtml || '') + ' <span id="typingIndicator" class="typing-indicator"></span>';
      }

      function setMobileChat(open) {
        document.body.classList.toggle('chat-open', !!open);
        const backBtn = document.getElementById('mobileBackBtn');
        const chatBackBtn = document.getElementById('chatBackBtn');
        if (backBtn) backBtn.style.display = open ? '' : 'none';
        if (chatBackBtn) chatBackBtn.style.display = open ? 'flex' : 'none';
        if (!open) {
          document.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
          exitSelectionMode();
        }
      }

      function closeChat() {
        setMobileChat(false);
        activeChat = null;
        chatLoadState = {};
        chatTitle.textContent = 'Velg en samtale';
        setChatMeta('');
        messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><h3>Ingen samtale valgt</h3><p>Velg en kontakt eller gruppe.</p></div>';
        composer.style.display = 'none';
        document.getElementById('exportBtn').style.display = 'none';
        document.getElementById('threadSummaryBtn').style.display = 'none';
        document.getElementById('folderSuggestBtn').style.display = 'none';
        document.getElementById('wallpaperBtn').style.display = 'none';
        document.getElementById('muteBtn').style.display = 'none';
        document.getElementById('groupAdminBtn').style.display = 'none';
        document.getElementById('pollBtn').style.display = 'none';
        document.getElementById('verifyBtn').style.display = 'none';
        document.getElementById('inviteBtn').style.display = 'none';
        document.getElementById('lockBtn').style.display = 'none';
        document.getElementById('lockBtn').textContent = '🔓';
        document.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
      }

      function toggleMessageSelection(msgEl, msgId) {
        if (!selectionMode) {
          selectionMode = true;
          selectedMessages.clear();
        }
        if (selectedMessages.has(msgId)) {
          selectedMessages.delete(msgId);
          msgEl.classList.remove('selected');
        } else {
          selectedMessages.add(msgId);
          msgEl.classList.add('selected');
        }
        if (selectedMessages.size === 0) exitSelectionMode();
        else updateSelectionToolbar();
      }

      function exitSelectionMode() {
        selectionMode = false;
        selectedMessages.clear();
        document.querySelectorAll('.msg.selected').forEach(el => el.classList.remove('selected'));
        const toolbar = document.getElementById('selectionToolbar');
        if (toolbar) toolbar.style.display = 'none';
        const chatActions = document.querySelector('.chat-actions');
        if (chatActions) chatActions.style.display = '';
      }

      function updateSelectionToolbar() {
        const toolbar = document.getElementById('selectionToolbar');
        const chatActions = document.querySelector('.chat-actions');
        const count = document.getElementById('selCount');
        if (!toolbar) return;
        toolbar.style.display = 'flex';
        if (chatActions) chatActions.style.display = 'none';
        if (count) count.textContent = selectedMessages.size + ' valgt';
      }

      async function showUnlockModal() {
        if (window._cryptoChatLocked) return;
        window._cryptoChatLocked = true;
        document.getElementById('lockBtn').textContent = '🔒';
        const overlay = document.createElement('div');
        overlay.id = 'lockOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99999;';
        const box = document.createElement('div');
        box.style.cssText = 'background:#fff;padding:14px;border-radius:14px;width:280px;max-width:92vw;box-shadow:0 10px 30px rgba(0,0,0,.35);';
        box.innerHTML = '<div style="font-weight:800;margin-bottom:8px;">🔐 Låst</div>' +
          '<input id="lockPin" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="PIN" autocomplete="one-time-code" style="width:100%;padding:10px;font-size:1rem;letter-spacing:.4rem;text-align:center;border:1px solid #ccc;border-radius:10px;" />' +
          '<button id="unlockBtn" style="margin-top:8px;width:100%;padding:8px;border:0;border-radius:10px;background:#1a73e8;color:#fff;font-weight:800;">Lås opp</button>';
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        const input = document.getElementById('lockPin');
        input.focus();
        const attempt = async () => {
          const pin = input.value.trim();
          if (!pin) return;
          const ok = await fetch('/auth/session/pin', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({pin})});
          if (ok.status === 200) { overlay.remove(); window._cryptoChatLocked = false; document.getElementById('lockBtn').textContent = '🔓'; };
        };
        document.getElementById('unlockBtn').addEventListener('click', attempt);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); });
      }

      function setupIdleTimer() {
        let timer;
        const reset = () => { clearTimeout(timer); timer = setTimeout(() => { if (window.__APP__?.username) showUnlockModal(); }, 60000); };
        window.addEventListener('mousemove', reset);
        window.addEventListener('keydown', reset);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reset(); else clearTimeout(timer); });
        reset();
      }


      // (Escape handler consolidated below in keyboard shortcuts block)

      function isArchivedChat(id, type) {
        return archivedChats.some(e => e.target === id && e.type === type);
      }

      function renderUsers() {
        usersList.innerHTML = '';
        const list = Array.isArray(users) ? users : [];
        const sorted = list.slice().sort((a, b) => {
          const aName = typeof a === 'string' ? a : (a && a.username) || '';
          const bName = typeof b === 'string' ? b : (b && b.username) || '';
          const aPinned = isPinnedChat(aName, 'user') ? 1 : 0;
          const bPinned = isPinnedChat(bName, 'user') ? 1 : 0;
          if (bPinned !== aPinned) return bPinned - aPinned;
          return 0;
        });
        sorted.forEach(u => {
          const name = typeof u === 'string' ? u : (u && u.username) || JSON.stringify(u);
          if (isBlockedUser(name)) return;
          if (isArchivedChat(name, 'user')) return;
          const displayName = (typeof u === 'object' && u && u.display_name) ? u.display_name : getDisplayName(name);
          if (typeof u === 'object' && u && u.username) userProfiles[u.username] = u;
          const item = document.createElement('div');
          item.className = 'item' + (isMutedChat(name) ? ' muted' : '');
          item.dataset.user = name;
          const msgData = lastMessages[name] || {};
          const preview = typeof msgData === 'string' ? msgData : (msgData.text || '');
          const msgTime = typeof msgData === 'object' && msgData.timestamp ? formatSidebarTime(msgData.timestamp) : '';
          const verified = verificationStatuses[name] || false;
          const verifyIcon = verified ? '<span class="verify-icon" title="Verifisert">🛡️</span>' : '';
          const badge = (unreadCounts[name] || 0) > 0 ? '<span class="badge-count">' + Math.min(unreadCounts[name], 99) + '</span>' : '';
          const lastSeenText = presence[name] ? '' : (window.__lastSeenTimes && window.__lastSeenTimes[name] ? '<div class="last-seen">Sist sett: ' + escapeHtml(formatTime(window.__lastSeenTimes[name])) + '</div>' : '');
          const pinIcon = isPinnedChat(name, 'user') ? '<span class="pin-indicator" style="font-size:.65rem;margin-left:4px;" title="Festet">📌</span>' : '';
          const key = window.__allUsers?.find ? window.__allUsers.find(x => (x && x.username) === name) : undefined;
          const hasKey = (typeof key === 'object' && key && key.publicKey);
          const lockIcon = hasKey ? '<span class="e2ee" title="E2EE">🔒</span>' : '';
          const labels = chatLabels[name] || [];
          const labelBadges = labels.length ? '<div class="label-badges">' + labels.map(l => '<span class="label-badge">' + escapeHtml(l) + '</span>').join('') + '</div>' : '';
          const statusDot = onlineUsers.has(name) ? '<span class="online-dot"></span>' : '';
          item.innerHTML = '<div class="avatar-wrap">' + avatarHtml(name) + (presence[name] ? '<div class="presence"></div>' : '') + statusDot + '</div><div class="item-info"><div class="item-top"><span class="name">' + escapeHtml(displayName) + lockIcon + verifyIcon + pinIcon + '</span>' + (msgTime ? '<span class="preview-time">' + escapeHtml(msgTime) + '</span>' : '') + '</div><div class="preview">' + escapeHtml(preview) + lastSeenText + '</div>' + labelBadges + '</div>' + badge;
          item.addEventListener('click', () => { activateItem(usersList, item); openChat(name); });
          usersList.appendChild(item);
        });
      }

      function renderGroups() {
        groupsList.innerHTML = '';
        groups.forEach(g => {
          if (isArchivedChat(g.id, 'group')) return;
          const item = document.createElement('div');
          item.className = 'item';
          item.dataset.groupId = g.id;
          const groupMsgData = groupLastMessages[g.id] || {};
          const preview = typeof groupMsgData === 'string' ? groupMsgData : (groupMsgData.text || '');
          const groupMsgTime = typeof groupMsgData === 'object' && groupMsgData.timestamp ? formatSidebarTime(groupMsgData.timestamp) : '';
          const hasKey = !!(g && g.encryptedKey);
          const lockIcon = hasKey ? '<span class="e2ee" title="E2EE">🔒</span>' : '';
          const inviteIcon = g.invite_token ? '<span class="e2ee" title="Invitasjon aktiv">🔗</span>' : '';
          const labels = chatLabels[g.id] || [];
          const labelBadges = labels.length ? '<div class="label-badges">' + labels.map(l => '<span class="label-badge">' + escapeHtml(l) + '</span>').join('') + '</div>' : '';
          item.innerHTML = '<div class="avatar-wrap">' + avatarHtml(g.name) + '</div><div class="item-info"><div class="item-top"><span class="name">' + escapeHtml(g.name) + lockIcon + inviteIcon + '</span>' + (groupMsgTime ? '<span class="preview-time">' + escapeHtml(groupMsgTime) + '</span>' : '') + '</div><div class="preview">' + escapeHtml(preview || ((g.members || []).length + ' medlemmer')) + '</div>' + labelBadges + '</div><button class="btn btn-small btn-ghost delete-group" data-id="' + escapeHtml(g.id) + '">Slett</button>';
          item.addEventListener('click', (e) => { if (e.target.closest('.delete-group')) return; activateItem(groupsList, item); openGroup(g.id); });
          const del = item.querySelector('.delete-group');
          if (del) del.addEventListener('click', async () => { await deleteGroup(g.id); });
          groupsList.appendChild(item);
        });
      }

      async function deleteGroup(groupId) {
        const nameInput = prompt('Skriv inn gruppenavn for aa bekrefte sletting:');
        if (!nameInput) return;
        const allGroups = await loadJSON('/groups');
        const group = (allGroups.groups || []).find(g => g.id === groupId);
        if (!group || group.name !== nameInput) return toast('Navnet matcher ikke');
        if (!confirm('Slett gruppen? Dette kan ikke angres.')) return;
        try {
          await fetch('/groups/' + encodeURIComponent(groupId), { method: 'DELETE' });
          toast('Gruppen er slettet', 'success');
          const data = await loadJSON('/groups');
          groups.length = 0;
          groups.push(...(data.groups || []));
          renderGroups();
        } catch (e) {
          toast('Kunne ikke slette gruppe');
        }
      }

      function activateItem(listContainer, item) {
        const siblings = listContainer.querySelectorAll('.item');
        siblings.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      }

      function avatarGradient(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const h1 = Math.abs(hash) % 360;
        const h2 = (h1 + 40) % 360;
        return 'linear-gradient(135deg, hsl(' + h1 + ',70%,55%), hsl(' + h2 + ',70%,55%))';
      }

      function avatarLetter(name) {
        return (name || '?')[0].toUpperCase();
      }

      function avatarHtml(name, size) {
        size = size || 32;
        const profile = userProfiles[name] || {};
        const avatar = profile.avatar || '';
        if (avatar && avatar.startsWith('data:')) {
          return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;"><img src="' + escapeHtml(avatar) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" /></div>';
        }
        return '<div class="avatar" style="background:' + avatarGradient(name) + ';width:' + size + 'px;height:' + size + 'px;">' + avatarLetter(name) + '</div>';
      }

      async function loadFolders() {
        try {
          const data = await loadJSON('/folders');
          chatFolders = data.folders || [];
        } catch(e) { chatFolders = []; }
        renderFolderTabs();
      }

      function renderFolderTabs() {
        const tabs = document.getElementById('folderTabs');
        if (!tabs) return;
        const defaultFolders = [
          { id: 'all', name: 'Alle' },
          { id: 'personal', name: 'Personlige' },
          { id: 'groups', name: 'Grupper' },
          { id: 'channels', name: 'Kanaler' },
        ];
        const folders = chatFolders.length > 1 ? chatFolders : defaultFolders;
        tabs.innerHTML = '';
        folders.forEach(f => {
          const btn = document.createElement('button');
          btn.className = 'folder-tab' + (f.id === currentFolder ? ' active' : '');
          btn.dataset.folder = f.id;
          const count = f.count ? '<span class="folder-count">' + f.count + '</span>' : '';
          btn.innerHTML = escapeHtml(f.name) + count;
          btn.addEventListener('click', () => setActiveFolder(f.id));
          tabs.appendChild(btn);
        });
      }

      function setActiveFolder(id) {
        currentFolder = id;
        document.querySelectorAll('.folder-tab').forEach(t => t.classList.toggle('active', t.dataset.folder === id));
        filterSidebar();
      }

      function showFolderEditor() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal" style="max-width:400px"><div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>Rediger mapper</strong><button class="modal-close" data-close-folder-editor="1">✕</button></div><div id="folderEditorList" style="margin-bottom:12px"></div><div style="display:flex;gap:8px"><input id="folderEditorInput" class="input-text" placeholder="Nytt mappenavn..." style="flex:1" maxlength="20" /><button id="folderEditorAddBtn" class="btn btn-primary">Legg til</button></div><div style="text-align:right;margin-top:12px"><button id="folderEditorSaveBtn" class="btn btn-primary">Lagre</button></div></div>';
        document.body.appendChild(overlay);
        overlay.querySelector('[data-close-folder-editor]')?.addEventListener('click', () => overlay.remove());
        document.getElementById('folderEditorSaveBtn')?.addEventListener('click', saveFolderEditor);
        renderFolderEditorList();
        document.getElementById('folderEditorAddBtn')?.addEventListener('click', () => {
          const input = document.getElementById('folderEditorInput');
          const name = input?.value.trim();
          if (!name) return;
          chatFolders.push({ id: 'f' + Date.now().toString(36), name, filters: [] });
          input.value = '';
          renderFolderEditorList();
        });
        document.getElementById('folderEditorInput')?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') document.getElementById('folderEditorAddBtn')?.click();
        });
      }

      function renderFolderEditorList() {
        const list = document.getElementById('folderEditorList');
        if (!list) return;
        list.innerHTML = chatFolders.map((f, i) => '<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="flex:1">' + escapeHtml(f.name) + '</span><button class="btn btn-small btn-ghost" data-remove-folder="' + i + '">✕</button></div>').join('');
        list.querySelectorAll('[data-remove-folder]').forEach((btn) => {
          btn.addEventListener('click', () => {
            chatFolders.splice(Number(btn.dataset.removeFolder), 1);
            renderFolderEditorList();
          });
        });
      }

      async function saveFolderEditor() {
        try {
          await loadJSON('/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folders: chatFolders }) });
          toast('Mapper lagret', 'success');
          document.querySelector('.modal-overlay')?.remove();
          loadFolders();
        } catch(e) { toast('Kunne ikke lagre mapper'); }
      }

      async function loadArchived() {
        try {
          const data = await loadJSON('/archived');
          archivedChats = Array.isArray(data) ? data : [];
        } catch(e) { archivedChats = []; }
        renderArchived();
      }

      function renderArchived() {
        const section = document.getElementById('archiveSection');
        const list = document.getElementById('archivedList');
        if (!section || !list) return;
        if (!archivedChats.length) { section.style.display = 'none'; return; }
        section.style.display = '';
        list.innerHTML = archivedChats.map(e => {
          let name = e.target;
          let avatar = '';
          let letter = '';
          if (e.type === 'group') {
            const g = groups.find(gr => gr.id === e.target);
            if (g) { name = g.name; avatar = 'linear-gradient(135deg,#5b8def,#3390ec)'; letter = '👥'; }
            else { avatar = 'linear-gradient(135deg,#5b8def,#3390ec)'; letter = '👥'; }
          } else {
            avatar = avatarGradient(e.target);
            letter = avatarLetter(e.target);
          }
          return '<div class="item" data-target="' + escapeHtml(e.target) + '" data-type="' + e.type + '" style="cursor:pointer"><div class="avatar-wrap"><div class="avatar" style="background:' + avatar + '">' + letter + '</div></div><div><div class="name">' + escapeHtml(name) + '</div><div class="preview" style="color:#6d8094;font-size:.75rem">Arkivert</div></div></div>';
        }).join('');
        list.querySelectorAll('.item').forEach(item => {
          item.addEventListener('click', () => {
            const target = item.dataset.target;
            const type = item.dataset.type;
            if (type === 'user') loadChat(target);
            else if (type === 'group') loadGroup(target);
          });
        });
      }

      async function toggleArchive(target, type) {
        try {
          await loadJSON('/archive/' + encodeURIComponent(target), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_type: type }) });
          if (!archivedChats.some(e => e.target === target && e.type === type)) {
            archivedChats.push({ target, type });
          }
          renderArchived();
          renderUsers();
          renderGroups();
        } catch(e) { toast('Kunne ikke arkivere'); }
      }

      async function unarchiveChat(target, type) {
        try {
          await loadJSON('/unarchive/' + encodeURIComponent(target), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_type: type }) });
          archivedChats = archivedChats.filter(e => !(e.target === target && e.type === type));
          renderArchived();
          renderUsers();
          renderGroups();
        } catch(e) { toast('Kunne ikke avarkivere'); }
      }

      function initScheduleButton() {
        const scheduleBtn = document.getElementById('scheduleBtn');
        if (!scheduleBtn) return;
        scheduleBtn.addEventListener('click', () => {
          if (!activeChat) { toast('Velg en samtale foerst'); return; }
          const overlay = document.createElement('div');
          overlay.className = 'modal-overlay';
          overlay.innerHTML = '<div class="modal" style="max-width:360px"><div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>Planlegg melding</strong><button class="modal-close" data-close-schedule="1">✕</button></div><textarea id="scheduleModalText" class="input-text" placeholder="Skriv melding..." style="width:100%;min-height:80px;resize:vertical;margin-bottom:8px"></textarea><input id="scheduleModalTime" type="datetime-local" class="input-text" style="width:100%;margin-bottom:12px" /><button id="scheduleModalSendBtn" class="btn btn-primary" style="width:100%">Planlegg</button></div>';
          document.body.appendChild(overlay);
          overlay.querySelector('[data-close-schedule]')?.addEventListener('click', () => overlay.remove());
          document.getElementById('scheduleModalSendBtn')?.addEventListener('click', async () => {
            const text = document.getElementById('scheduleModalText')?.value.trim();
            const timeVal = document.getElementById('scheduleModalTime')?.value;
            if (!text || !timeVal) { toast('Fyll inn melding og tidspunkt'); return; }
            try {
              const body = { ciphertext: text, send_at: new Date(timeVal).toISOString() };
              if (activeChat.type === 'user') body.recipient = activeChat.target;
              else body.group_id = activeChat.target;
              await loadJSON('/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              toast('Melding planlagt', 'success');
              overlay.remove();
            } catch(e) { toast('Kunne ikke planlegge melding'); }
          });
          document.getElementById('scheduleModalTime')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('scheduleModalSendBtn')?.click();
          });
          const min = new Date(Date.now() + 60000).toISOString().slice(0, 16);
          const timeInput = document.getElementById('scheduleModalTime');
          if (timeInput) { timeInput.min = min; timeInput.value = min; }
        });
      }

      function filterSidebar() {
        const sections = document.querySelectorAll('.sidebar .section');
        const savedItem = document.getElementById('savedMsgItem');
        if (currentFolder === 'all') {
          sections.forEach(s => s.style.display = '');
          if (savedItem) savedItem.style.display = '';
          renderUsers(); renderGroups(); renderChannels();
          return;
        }
        if (savedItem) savedItem.style.display = (currentFolder === 'personal' || currentFolder === 'all') ? '' : 'none';
        sections.forEach(s => {
          const title = s.querySelector('.section-title');
          if (!title) return;
          const text = title.textContent.trim();
          if (currentFolder === 'personal') {
            s.style.display = (text === 'MELDINGER') ? '' : 'none';
          } else if (currentFolder === 'groups') {
            s.style.display = (text === 'GRUPPER') ? '' : 'none';
          } else if (currentFolder === 'channels') {
            s.style.display = (text === 'KANALER') ? '' : 'none';
          } else {
            s.style.display = '';
          }
        });
        renderUsers(); renderGroups(); renderChannels();
      }

      async function loadPinnedChats() {
        try {
          const data = await loadJSON('/pinned-chats');
          pinnedChats = data.pinned || [];
        } catch(e) { pinnedChats = []; }
      }

      async function loadMutedChats() {
        try {
          const data = await loadJSON('/settings/mute');
          mutedChats = data.muted || [];
        } catch(e) { mutedChats = []; }
      }

      async function loadBlockedUsers() {
        try {
          const data = await loadJSON('/blocked');
          blockedUsers = data.blocked || [];
        } catch(e) { blockedUsers = []; }
      }

      function isBlockedUser(username) {
        return blockedUsers.includes(username);
      }

      async function loadChatNotifOverrides() {
        chatNotifOverrides = {};
      }

      function getChatNotifOverride(chatId, chatType) {
        return chatNotifOverrides[chatType + '_' + chatId];
      }

      function isPinnedChat(id, type) {
        return pinnedChats.some(p => p.id === id && p.type === type);
      }

      function isMutedChat(id) {
        return mutedChats.includes(id);
      }

      async function loadChannels() {
        try {
          const data = await loadJSON('/channels');
          channels = data.channels || [];
          window.__allChannels = channels;
        } catch(e) { channels = []; window.__allChannels = []; }
      }

      function renderChannels() {
        const list = document.getElementById('channelsList');
        if (!list) return;
        list.innerHTML = '';
        channels.forEach(ch => {
          const div = document.createElement('div');
          div.className = 'item' + (activeChat?.type === 'channel' && activeChat?.target === ch.id ? ' active' : '');
          div.innerHTML = '<div class="avatar-wrap"><div class="avatar" style="background:linear-gradient(135deg,#ff6b35,#cf6fef);">📢</div></div>'
            + '<div><div class="name">' + escapeHtml(ch.name) + '</div><div class="preview">' + escapeHtml((ch.description || '').slice(0,40)) + '</div></div>';
          div.addEventListener('click', () => openChannel(ch.id));
          list.appendChild(div);
        });
      }

      async function openChannel(channelId) {
        activeChat = { type: 'channel', target: channelId };
        userScrolledUp = false;
        resetDateSeparators();
        const ch = channels.find(c => c.id === channelId);
        document.getElementById('chatTitle').textContent = '📢 ' + (ch?.name || '');
        document.getElementById('chatMeta').textContent = (ch?.subscribers?.length || 0) + ' abonnenter';
        setMobileChat(true);
        document.getElementById('wallpaperBtn').style.display = 'none';
        document.getElementById('groupAdminBtn').style.display = 'none';
        document.getElementById('pollBtn').style.display = 'none';
        document.getElementById('exportBtn').style.display = '';
        document.getElementById('verifyBtn').style.display = 'none';
        document.getElementById('muteBtn').style.display = 'none';
        try {
          const data = await loadJSON('/channels/' + encodeURIComponent(channelId) + '/messages');
          await transitionMessages(() => { const box = document.getElementById('messages'); if (box) box.innerHTML = ''; });
          (data.messages || []).forEach(m => {
            const item = document.createElement('div');
            item.className = 'msg received';
            item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(m.sender) + '</span><span class="time">' + formatTime(m.timestamp) + '</span></div>'
              + '<div class="text">' + escapeHtml(m.ciphertext || '') + '</div>';
            messagesBox.appendChild(item);
          });
          messagesBox.scrollTop = messagesBox.scrollHeight;
        } catch(e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><p>Kunne ikke laste kanal</p></div>';
        }
        renderUsers();
        renderGroups();
        renderChannels();
      }

      renderUsers();
      renderGroups();

      loadJSON('/last-messages').then(data => {
        if (data.users) Object.assign(lastMessages, data.users);
        if (data.groups) Object.assign(groupLastMessages, data.groups);
        renderUsers();
        renderGroups();
      }).catch(() => {});
      document.getElementById('savedMsgItem').addEventListener('click', () => {
        document.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
        document.getElementById('savedMsgItem').classList.add('active');
        openSavedMessages();
      });

      async function openSavedMessages() {
        activeChat = { type: 'saved', target: '__self__' };
        userScrolledUp = false;
        resetDateSeparators();
        chatTitle.textContent = '📌 Lagrede meddelelser';
        setChatMeta('');
        await transitionMessages(() => { const box = document.getElementById('messages'); if (box) box.innerHTML = ''; });
        composer.style.display = 'flex';
        setMobileChat(true);
        clearImagePreview();
        document.getElementById('exportBtn').style.display = 'none';
        document.getElementById('threadSummaryBtn').style.display = 'none';
        document.getElementById('folderSuggestBtn').style.display = 'none';
        document.getElementById('pollBtn').style.display = 'none';
        try {
          const data = await loadJSON('/saved');
          const list = data.messages || [];
          messagesBox.innerHTML = '';
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">📌</div><h3>Ingen lagrede meldinger</h3><p>Bruk "Lagre" fra en meldingskontekst for å lagre her.</p></div>';
            return;
          }
          list.forEach(m => appendMessage(m));
          scrollToBottom();
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke laste lagrede meldinger</p></div>';
        }
      }

      async function saveMsgToSelf(messageId) {
        try {
          const msgs = await loadJSON('/messages/' + encodeURIComponent(activeChat.target));
          const msg = (msgs.messages || []).find(m => m.id === messageId);
          if (!msg) { toast('Melding ikke funnet'); return; }
          await loadJSON('/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: msg.text || msg.ciphertext || '', type: msg.type || 'text' }) });
          toast('Melding lagret', 'success');
        } catch (e) {
          toast('Kunne ikke lagre melding');
        }
      }

      // ── Forward message ──
      async function forwardMsg(messageId) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        let optionsHtml = '<option value="">Velg bruker...</option>';
        const usersRes = await loadJSON('/users').catch(() => ({ users: [] }));
        (usersRes.users || []).forEach(u => {
          const name = typeof u === 'string' ? u : u.username;
          if (name !== window.__APP__?.username) optionsHtml += '<option value="user:' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
        });
        groups.forEach(g => {
          optionsHtml += '<option value="group:' + escapeHtml(g.id) + '">' + escapeHtml(g.name) + '</option>';
        });
        overlay.innerHTML = '<div class="modal" style="max-width:400px"><h2>Videresend melding</h2>'
          + '<div class="field"><label>Mål</label><select id="fwdTarget" style="width:100%;padding:10px;background:var(--c-input-bg);color:var(--c-input-text);border:1px solid var(--c-input-border);border-radius:10px;">'
          + optionsHtml + '</select></div>'
          + '<div class="modal-actions"><button id="fwdSendBtn" class="btn btn-primary btn-small">Videresend</button>'
          + '<button id="fwdCancelBtn" class="btn btn-ghost btn-small">Avbryt</button></div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#fwdCancelBtn').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#fwdSendBtn').addEventListener('click', async () => {
          const val = overlay.querySelector('#fwdTarget').value;
          if (!val) { toast('Velg et mål'); return; }
          const [targetType, target] = val.split(':');
          try {
            await loadJSON('/messages/' + encodeURIComponent(messageId) + '/forward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, target_type: targetType }) });
            toast('Melding videresendt', 'success');
            overlay.remove();
          } catch (e) {
            toast('Kunne ikke videresende');
          }
        });
      }

      function showForwardModal(msgId) {
        const overlay = document.createElement('div');
        overlay.id = 'forwardOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        const users = window.__APP__?.userList || [];
        const groups = window.__groups || [];
        let html = '<div style="background:#17213b;border-radius:16px;max-width:360px;width:90%;max-height:70vh;overflow-y:auto;padding:16px;">'
          + '<h3 style="color:#e7e8f3;margin:0 0 12px;font-size:1rem;">Videresend melding</h3>';
        if (users.length) {
          html += '<div style="font-size:.75rem;color:#6d8094;margin:4px 0;">BRUKERE</div>';
          users.forEach(u => {
            html += '<div class="forward-item" data-target="' + escapeHtml(u) + '" data-type="user"><div class="forward-avatar">' + escapeHtml((u[0] || '?').toUpperCase()) + '</div><div class="forward-name">' + escapeHtml(u) + '</div></div>';
          });
        }
        if (groups.length) {
          html += '<div style="font-size:.75rem;color:#6d8094;margin:8px 0 4px;">GRUPPER</div>';
          groups.forEach(g => {
            html += '<div class="forward-item" data-target="' + escapeHtml(g.id || g.name) + '" data-type="group"><div class="forward-avatar">' + escapeHtml((g.name || 'G')[0].toUpperCase()) + '</div><div class="forward-name">' + escapeHtml(g.name || g.id) + '</div></div>';
          });
        }
        html += '</div>';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        overlay.querySelectorAll('.forward-item').forEach(el => {
          el.addEventListener('click', async () => {
            const target = el.dataset.target;
            const type = el.dataset.type;
            const msgEl = document.querySelector('.msg[data-msg-id="' + msgId + '"]');
            const textEl = msgEl?.querySelector('.text');
            const origText = textEl?.textContent || '';
            const forwardedText = '➡️ Videresendt:\n' + origText;
            if (type === 'user') {
              await loadJSON('/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: target, text: forwardedText }) });
            } else {
              await loadJSON('/groups/' + encodeURIComponent(target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: forwardedText }) });
            }
            toast('Videresendt til ' + target, 'success');
            overlay.remove();
          });
        });
      }

      // ── Export chat ──
      document.getElementById('exportBtn').addEventListener('click', () => {
        if (!activeChat || activeChat.type === 'saved') return;
        window.open('/export/' + activeChat.type + '/' + encodeURIComponent(activeChat.target), '_blank');
      });

      // ── AI-thread summary ──
      document.getElementById('threadSummaryBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type === 'saved') return;
        const btn = document.getElementById('threadSummaryBtn');
        btn.textContent = '⏳';
        try {
          const r = await loadJSON('/ai/chat/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_type: activeChat.type, chat_id: activeChat.target }) });
          if (!r.success) { toast(r.message || 'Kunne ikke oppsummere'); return; }
          let panel = document.querySelector('.ai-thread-panel');
          if (panel) panel.remove();
          panel = document.createElement('div');
          panel.className = 'ai-thread-panel';
          panel.innerHTML = '<div class="ai-thread-head"><span>📝 AI-oppsummering</span><button class="ai-thread-close">✕</button></div><div class="ai-thread-body">' + escapeHtml(r.summary) + '</div>';
          document.body.appendChild(panel);
          panel.querySelector('.ai-thread-close').addEventListener('click', () => panel.remove());
          setTimeout(() => { if (panel.isConnected) panel.remove(); }, 60000);
        } catch (e) { toast('Kunne ikke oppsummere'); }
        finally { btn.textContent = '📝'; }
      });

      // ── AI folder suggestion ──
      document.getElementById('folderSuggestBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type === 'saved') return;
        const btn = document.getElementById('folderSuggestBtn');
        btn.textContent = '⏳';
        try {
          const preview = [];
          messagesBox.querySelectorAll('.msg').forEach(msg => {
            const t = msg.querySelector('.msg-text, .text');
            if (t && t.textContent) preview.push(t.textContent.substring(0, 120));
          });
          const chatName = activeChat.type === 'user'
            ? getDisplayName(activeChat.target)
            : ((groups.find(g => g.id === activeChat.target) || {}).name || activeChat.target);
          const r = await loadJSON('/ai/folder-suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_name: chatName, preview: preview.slice(-8).join(' | ') }) });
          if (!r.success) { toast(r.message || 'Kunne ikke foreslå mappe'); return; }
          const suggestion = r.suggestion || '';
          if (confirm('✨ AI foreslår mappen «' + suggestion + '» for denne samtalen.\n\nLegge til mappen?')) {
            chatFolders = chatFolders.filter(f => f.id !== 'all' && f.id !== 'personal' && f.id !== 'groups' && f.id !== 'channels');
            chatFolders.push({ id: 'f' + Date.now().toString(36), name: suggestion.substring(0, 20), filters: [] });
            await loadJSON('/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folders: chatFolders }) });
            toast('Mappe «' + suggestion.substring(0, 20) + '» lagt til', 'success');
            loadFolders();
          }
        } catch (e) { toast('Kunne ikke foreslå mappe'); }
        finally { btn.textContent = '📁✨'; }
      });

      async function openChat(user) {
        activeChat = { type: 'user', target: user };
        replyingTo = null;
        userScrolledUp = false;
        resetDateSeparators();
        delete chatLoadState[user];
        const replyBar = document.getElementById('replyBar');
        if (replyBar) replyBar.style.display = 'none';
        setMobileChat(true);
        clearTimeout(typingTimeout);
        isTyping = false;
        chatTitle.innerHTML = avatarHtml(user, 28) + '<span style="margin-left:8px;">' + escapeHtml(getDisplayName(user)) + '</span>';
        history.pushState({ chat: user, type: 'user' }, '', '#chat/' + user);
        const key = await getPeerPublicKeyPem(user);
        activeChat.peerPublicKey = key;
        setChatMeta(key ? '<span class="e2ee">🔒 Ende-til-ende-kryptert</span>' : '');
        const presenceData = await loadJSON('/presence/' + encodeURIComponent(user)).catch(() => ({}));
        if (presenceData.online) {
          const e2eeHtml = activeChat.peerPublicKey ? '<span class="e2ee">🔒 Ende-til-ende-kryptert</span> · ' : '';
          document.getElementById('chatMeta').innerHTML = e2eeHtml + 'online';
        } else if (presenceData.lastSeen) {
          const e2eeHtml = activeChat.peerPublicKey ? '<span class="e2ee">🔒 Ende-til-ende-kryptert</span> · ' : '';
          document.getElementById('chatMeta').innerHTML = e2eeHtml + 'sist sett ' + formatTime(presenceData.lastSeen);
        }
        await transitionMessages(() => { const box = document.getElementById('messages'); if (box) box.innerHTML = ''; });
        composer.style.display = 'flex';
        clearImagePreview();
        document.getElementById('exportBtn').style.display = '';
        document.getElementById('threadSummaryBtn').style.display = '';
        document.getElementById('folderSuggestBtn').style.display = '';
        document.getElementById('pollBtn').style.display = 'none';
        await fetchVerificationStatus(user);
        updateVerifyButton();
        await loadChat(user);
        loadPinnedMessages(user);
        addDisappearToggle();
        await checkTypingIndicator();
        const input = document.getElementById('messageInput');
        if (input) input.focus();
      }

      async function loadChat(user) {
        if (!user || activeChat?.type !== 'user' || activeChat?.target !== user) return;
        try {
          messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div><div class="skeleton-msg skeleton-received"></div><div class="skeleton-msg skeleton-sent short"></div></div>';
          const pageSize = 50;
          const countData = await loadJSON('/messages/' + encodeURIComponent(user) + '?limit=1');
          const total = countData.total || 0;
          const offset = Math.max(0, total - pageSize);
          const data = await loadJSON('/messages/' + encodeURIComponent(user) + '?limit=' + pageSize + '&offset=' + offset);
          messagesBox.innerHTML = '';
          chatLoadState[user] = { offset: offset, hasMore: offset > 0, total: total, pageSize: pageSize };
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Ingen meldinger</p></div>';
          } else {
            const isFirst = !firstLoadPerChat.has(user);
            firstLoadPerChat.add(user);
            list.forEach(m => {
              if (m.id && !knownMessageIds.has(m.id)) {
                if (!isFirst && m.sender !== (window.__APP__?.username || '')) showMessageNotification(m);
                knownMessageIds.add(m.id);
              }
              appendMessage(m, user);
            });
            messagesBox.scrollTop = messagesBox.scrollHeight;
          }
          await loadJSON('/read_receipts/' + encodeURIComponent(user), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
          if (list.length) {
            const last = list[list.length - 1];
            lastMessages[user] = { text: last.text || '', timestamp: last.timestamp || '' };
          }
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke hente meldinger</p></div>';
          toast('Kunne ikke hente meldinger');
        }
      }

      async function loadOlderMessages() {
        if (!activeChat || activeChat.type !== 'user') return;
        const user = activeChat.target;
        const state = chatLoadState[user];
        if (!state || !state.hasMore || state._loading) return;
        state._loading = true;
        const newOffset = Math.max(0, state.offset - state.pageSize);
        const spinner = document.createElement('div');
        spinner.className = 'load-more-spinner';
        spinner.style.textAlign = 'center';
        spinner.style.padding = '12px';
        spinner.innerHTML = '<div class="spinner"></div>';
        messagesBox.insertBefore(spinner, messagesBox.firstChild);
        const prevScrollHeight = messagesBox.scrollHeight;
        try {
          const data = await loadJSON('/messages/' + encodeURIComponent(user) + '?limit=' + state.pageSize + '&offset=' + newOffset);
          const list = data.messages || [];
          if (list.length) {
            const container = document.createElement('div');
            list.forEach(m => {
              if (m.id && !knownMessageIds.has(m.id)) {
                knownMessageIds.add(m.id);
              }
              appendMessage(m, user, container);
            });
            await new Promise(r => setTimeout(r, 0));
            const firstExisting = messagesBox.firstChild;
            while (container.firstChild) {
              messagesBox.insertBefore(container.firstChild, firstExisting);
            }
            const newScrollHeight = messagesBox.scrollHeight;
            messagesBox.scrollTop = newScrollHeight - prevScrollHeight;
            state.offset = newOffset;
            state.hasMore = newOffset > 0;
            state.total = data.total || state.total;
          } else {
            state.hasMore = false;
          }
        } catch (e) {
        } finally {
          spinner.remove();
          state._loading = false;
        }
      }

      async function openGroup(groupId) {
        const group = groups.find(g => g.id === groupId);
        activeChat = { type: 'group', target: groupId, groupE2EEKey: null };
        replyingTo = null;
        userScrolledUp = false;
        resetDateSeparators();
        delete chatLoadState[groupId];
        const replyBar = document.getElementById('replyBar');
        if (replyBar) replyBar.style.display = 'none';
        clearTimeout(typingTimeout);
        isTyping = false;
        chatTitle.textContent = group ? group.name : 'Gruppe';
        setMobileChat(true);
        history.pushState({ chat: groupId, type: 'group' }, '', '#group/' + groupId);
        await transitionMessages(() => { const box = document.getElementById('messages'); if (box) box.innerHTML = ''; });
        composer.style.display = 'flex';
        clearImagePreview();
        let e2eeHtml = '';
        try {
          const keyData = await loadJSON('/groups/' + encodeURIComponent(groupId) + '/keys');
          if (keyData.encryptedKey) {
            const ownPub = await getPeerPublicKeyPem(window.__APP__?.username || '');
            if (ownPub) {
              const sharedKey = await window.__CRYPTO__.getSharedKey(ownPub);
              const parts = keyData.encryptedKey.split('.');
              if (parts.length === 2) {
                const iv = base64ToArrayBuffer(parts[0]);
                const enc = base64ToArrayBuffer(parts[1]);
                const rawKey = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, enc);
                activeChat.groupE2EEKey = await window.crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
                e2eeHtml = '<span class="e2ee">🔒 E2EE i gruppe</span>';
              }
            }
          } else if (group && (group.members || []).length) {
            let anyKey = false;
            for (const member of group.members) { if (await getPeerPublicKeyPem(member)) { anyKey = true; break; } }
            if (anyKey) e2eeHtml = '<span class="e2ee">🔒 Delvis E2EE i gruppe</span>';
          }
        } catch (e) {
          if (group && (group.members || []).length) {
            let anyKey = false;
            for (const member of group.members) { if (await getPeerPublicKeyPem(member)) { anyKey = true; break; } }
            if (anyKey) e2eeHtml = '<span class="e2ee">🔒 Delvis E2EE i gruppe</span>';
          }
        }
        setChatMeta(e2eeHtml);
        updateVerifyButton();
        document.getElementById('exportBtn').style.display = '';
        document.getElementById('threadSummaryBtn').style.display = '';
        document.getElementById('folderSuggestBtn').style.display = '';
        document.getElementById('pollBtn').style.display = '';
        await loadGroup(groupId);
        loadPinnedMessages(groupId);
        await checkTypingIndicator();
        const input = document.getElementById('messageInput');
        if (input) input.focus();
      }

      async function loadGroup(groupId) {
        if (!groupId || activeChat?.type !== 'group' || activeChat?.target !== groupId) return;
        try {
          messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div><div class="skeleton-msg skeleton-received"></div><div class="skeleton-msg skeleton-sent short"></div></div>';
          const data = await loadJSON('/groups/' + encodeURIComponent(groupId) + '/messages');
          messagesBox.innerHTML = '';
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Ingen gruppemeldinger</p></div>';
          } else {
            const isFirst = !firstLoadPerChat.has(groupId);
            firstLoadPerChat.add(groupId);
            list.forEach(m => {
              if (m.id && !knownMessageIds.has(m.id)) {
                if (!isFirst && m.sender !== (window.__APP__?.username || '')) showMessageNotification(m);
                knownMessageIds.add(m.id);
              }
              appendMessage(m, groupId);
            });
            const last = list[list.length - 1];
            if (last) {
              let text = '';
              if (last.type === 'file' || last.type === 'file_e2ee') text = '📎 ' + (last.filename || 'fil');
              else text = (last.sender ? last.sender + ': ' : '') + (last.text || '');
              groupLastMessages[groupId] = { text: text, timestamp: last.timestamp || '' };
            }
          }
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke hente gruppemeldinger</p></div>';
          toast('Kunne ikke hente gruppemeldinger');
        }
      }

      function renderCallOverlay(info) {
        let overlay = document.getElementById('callOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'callOverlay';
          overlay.className = 'call-overlay';
          document.body.appendChild(overlay);
        }
        const isVideo = info.type === 'video';
        const remoteLabel = info.remote || '';
        const status = info.status || 'Ringer...';
        overlay.innerHTML = `
          <div class="call-container">
            <div class="call-header">
              <span class="call-status">${escapeHtml(status)}</span>
              <span class="call-name">${escapeHtml(remoteLabel)}</span>
            </div>
            <div class="call-videos">
              <video id="remoteVideo" class="call-video remote" autoplay playsinline></video>
              <video id="localVideo" class="call-video local" autoplay playsinline muted></video>
            </div>
            <div class="call-actions">
              <button id="callMicToggle" class="call-btn" title="Mikrofon">🎤</button>
              <button id="callCamToggle" class="call-btn" title="Kamera">📷</button>
              <button id="callScreenShare" class="call-btn" title="Del skjerm">🖥️</button>
              <button id="callHangup" class="call-btn call-hangup" title="Legg på">📞</button>
            </div>
          </div>
        `;
        document.getElementById('callHangup').addEventListener('click', hangUp);
        document.getElementById('callMicToggle').addEventListener('click', () => {
          if (localStream) {
            const audio = localStream.getAudioTracks()[0];
            if (audio) { audio.enabled = !audio.enabled; document.getElementById('callMicToggle').textContent = audio.enabled ? '🎤' : '🔇'; }
          }
        });
        document.getElementById('callCamToggle').addEventListener('click', () => {
          if (localStream) {
            const video = localStream.getVideoTracks()[0];
            if (video) { video.enabled = !video.enabled; document.getElementById('callCamToggle').textContent = video.enabled ? '📷' : '📷❌'; }
          }
        });
        document.getElementById('callScreenShare').addEventListener('click', async () => {
          try {
            if (peerConnection.getSenders().some(s => s.track && s.track.kind === 'video' && s.track.label.startsWith('Screen'))) {
              stopScreenShare();
              if (window.__SOCKET && currentCall?.target) {
                window.__SOCKET.emit('call_signal', { target: currentCall.target, type: 'screen_share_stop', payload: {} });
              }
              return;
            }
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const screenTrack = screenStream.getVideoTracks()[0];
            screenTrack.onended = () => {
              stopScreenShare();
              if (window.__SOCKET && currentCall?.target) {
                window.__SOCKET.emit('call_signal', { target: currentCall.target, type: 'screen_share_stop', payload: {} });
              }
            };
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
            const lv = document.getElementById('localVideo');
            if (lv) lv.srcObject = screenStream;
            document.getElementById('callScreenShare').textContent = '🖥️✅';
            currentCall.screenSharing = true;
            currentCall.screenStream = screenStream;
            if (window.__SOCKET && currentCall?.target) {
              window.__SOCKET.emit('call_signal', { target: currentCall.target, type: 'screen_share_start', payload: {} });
            }
          } catch (e) {
            if (e.name !== 'AbortError') toast('Kunne ikke dele skjerm');
          }
        });
        if (localStream) {
          const lv = document.getElementById('localVideo');
          if (lv) lv.srcObject = localStream;
        }
      }

      function stopScreenShare(silent) {
        if (currentCall && currentCall.screenStream) {
          currentCall.screenStream.getTracks().forEach(t => t.stop());
          currentCall.screenStream = null;
        }
        if (localStream && peerConnection) {
          const camTrack = localStream.getVideoTracks()[0];
          if (camTrack) {
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
          }
        }
        const lv = document.getElementById('localVideo');
        if (lv && localStream) lv.srcObject = localStream;
        const btn = document.getElementById('callScreenShare');
        if (btn) btn.textContent = '🖥️';
        if (currentCall) currentCall.screenSharing = false;
        if (!silent && window.__SOCKET && currentCall?.target) {
          window.__SOCKET.emit('call_signal', { target: currentCall.target, type: 'screen_share_stop', payload: {} });
        }
      }

      function updateCallStatus(status) {
        const el = document.querySelector('.call-status');
        if (el) el.textContent = status;
      }

      function removeCallOverlay() {
        if (currentCall && currentCall.screenStream) {
          currentCall.screenStream.getTracks().forEach(t => t.stop());
        }
        const overlay = document.getElementById('callOverlay');
        if (overlay) overlay.remove();
        if (peerConnection) { peerConnection.close(); peerConnection = null; }
        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        if (callPollInterval) { clearInterval(callPollInterval); callPollInterval = null; }
        if (callRecorder) { try { callRecorder.stop(); } catch(e) {} callRecorder = null; }
        currentCall = null;
      }

      async function startCall(target, type) {
        try {
          const constraints = { audio: true, video: type === 'video' };
          localStream = await navigator.mediaDevices.getUserMedia(constraints);
          const initData = await loadJSON('/calls/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, type }) });
          if (!initData.success) { toast(initData.message || 'Kunne ikke starte samtale'); localStream.getTracks().forEach(t => t.stop()); localStream = null; return; }
          currentCall = { id: initData.call_id, target, type, role: 'caller' };
          renderCallOverlay({ remote: target, type, status: 'Ringer...' });
          peerConnection = new RTCPeerConnection(ICE_SERVERS);
          localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
          peerConnection.ontrack = (e) => { const rv = document.getElementById('remoteVideo'); if (rv) rv.srcObject = e.streams[0]; };
          peerConnection.onicecandidate = (e) => { if (e.candidate) loadJSON('/calls/ice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id, candidate: e.candidate.toJSON() }) }).catch(() => {}); };
          peerConnection.onconnectionstatechange = () => { const s = peerConnection.connectionState; if (s === 'connected') updateCallStatus('Tilkoblet'); if (s === 'disconnected' || s === 'failed') hangUp(); };
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          await loadJSON('/calls/offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id, sdp: peerConnection.localDescription.toJSON() }) });
          startCallPolling();
        } catch (e) {
          toast('Kunne ikke starte samtale: ' + e.message);
          removeCallOverlay();
        }
      }

      async function answerCall(callId, caller, type) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
          currentCall = { id: callId, target: caller, type, role: 'callee' };
          renderCallOverlay({ remote: caller, type, status: 'Tilkoblet' });
          peerConnection = new RTCPeerConnection(ICE_SERVERS);
          localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
          peerConnection.ontrack = (e) => { const rv = document.getElementById('remoteVideo'); if (rv) rv.srcObject = e.streams[0]; };
          peerConnection.onicecandidate = (e) => { if (e.candidate) loadJSON('/calls/ice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id, candidate: e.candidate.toJSON() }) }).catch(() => {}); };
          peerConnection.onconnectionstatechange = () => { const s = peerConnection.connectionState; if (s === 'disconnected' || s === 'failed') hangUp(); };
          const offerData = await loadJSON('/calls/offer/' + callId);
          if (offerData.sdp) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            await loadJSON('/calls/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: callId, sdp: peerConnection.localDescription.toJSON() }) });
          }
          startCallPolling();
        } catch (e) {
          toast('Kunne ikke svare: ' + e.message);
          removeCallOverlay();
        }
      }

      async function hangUp() {
        if (currentCall) {
          loadJSON('/calls/hangup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: currentCall.id }) }).catch(() => {});
        }
        removeCallOverlay();
      }

      function startCallPolling() {
        if (callPollInterval) clearInterval(callPollInterval);
        callPollInterval = setInterval(async () => {
          if (!currentCall) { clearInterval(callPollInterval); return; }
          try {
            if (currentCall.role === 'caller') {
              const ansData = await loadJSON('/calls/answer/' + currentCall.id);
              if (ansData.sdp && peerConnection && !peerConnection.currentRemoteDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(ansData.sdp));
                updateCallStatus('Tilkoblet');
              }
              if (ansData.status === 'ended') { removeCallOverlay(); toast('Samtale avsluttet'); return; }
            }
            const iceData = await loadJSON('/calls/ice/' + currentCall.id);
            if (iceData.candidates && peerConnection) {
              for (const c of iceData.candidates) {
                try { await peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
            }
            const statusData = await loadJSON('/calls/status/' + currentCall.id);
            if (statusData.status === 'ended') { removeCallOverlay(); toast('Samtale avsluttet'); }
          } catch {}
        }, 800);
      }

      async function checkIncomingCalls() {
        try {
          if (currentCall) return;
          const data = await loadJSON('/calls/incoming');
          if (data.call) {
            const call = data.call;
            const accept = confirm(`${call.caller} ringer (${call.type === 'video' ? 'video' : 'lyd'}). Svare?`);
            if (accept) {
              await answerCall(call.id, call.caller, call.type);
            } else {
              loadJSON('/calls/hangup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call_id: call.id }) }).catch(() => {});
            }
          }
        } catch {}
      }

      function invertReactions(reactions) {
        const inverted = {};
        if (!reactions || typeof reactions !== 'object') return inverted;
        Object.entries(reactions).forEach(([user, emojis]) => {
          if (!Array.isArray(emojis)) return;
          emojis.forEach(emoji => {
            if (!inverted[emoji]) inverted[emoji] = [];
            inverted[emoji].push(user);
          });
        });
        return inverted;
      }

      function startReply(msgId) {
        const msgEl = messagesBox.querySelector('[data-msg-id="' + CSS.escape(msgId) + '"]');
        if (!msgEl || msgEl.classList.contains('deleted-msg')) return;
        const sender = msgEl.querySelector('.sender')?.textContent || '';
        const textEl = msgEl.querySelector('.msg-text');
        const text = textEl ? textEl.textContent : '';
        replyingTo = { id: msgId, sender, text };
        document.getElementById('replyBar').style.display = 'flex';
        document.getElementById('replyBarName').textContent = sender;
        document.getElementById('replyBarPreview').textContent = text.substring(0, 60);
        document.getElementById('messageInput').focus();
      }

      function showQuickActions(msgEl, x, y) {
        document.querySelectorAll('.context-menu').forEach(el => el.remove());
        const msgId = msgEl.dataset.msgId;
        const menu = document.createElement('div');
        menu.className = 'context-menu';

        const isOwn = msgEl.classList.contains('sent');

        const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
        let html = '<div class="ctx-reactions">' + quickReactions.map(e =>
          '<button data-emoji="' + e + '">' + e + '</button>'
        ).join('') + '</div>';

        const actionDefs = [
          { icon: '↩', label: 'Svar', action: () => startReply(msgId) },
          { icon: '↪', label: 'Videresend', action: () => forwardMsg(msgId) },
          { icon: '📋', label: 'Kopier', action: () => {
            const text = msgEl.querySelector('.msg-text');
            if (text) { navigator.clipboard.writeText(text.textContent); toast('Kopiert', 'success'); }
          }},
          { icon: '📋', label: 'Lagre som mal', action: () => {
            const textEl = msgEl.querySelector('.text, .msg-text');
            saveTemplate(textEl?.textContent || '');
          }},
          { icon: '📌', label: 'Fest', action: async () => {
            if (!activeChat) return;
            try {
              await loadJSON('/pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_target: activeChat.target, msg_id: msgId, pin: true }) });
              toast('Melding festet', 'success');
            } catch(e) { toast('Kunne ikke feste'); }
          }},
          { icon: '⭐', label: 'Lagre', action: async () => {
            try {
              await loadJSON('/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: msgId }) });
              toast('Lagret', 'success');
            } catch(e) { toast('Kunne ikke lagre'); }
          }},
          { icon: '⏰', label: 'Påminn meg', action: () => showReminderPicker(msgId) },
          { icon: '🔗', label: 'Kopier lenke', action: () => {
            if (!activeChat || activeChat.type === 'saved') return;
            const route = activeChat.type === 'group'
              ? '#group/' + encodeURIComponent(activeChat.target)
              : '#chat/' + encodeURIComponent(activeChat.target);
            const url = window.location.origin + window.location.pathname + route + '&mid=' + encodeURIComponent(msgId);
            navigator.clipboard.writeText(url);
            toast('Lenke til melding kopiert', 'success');
          }},
          { icon: '🌐', label: 'Oversett', action: async () => {
            const textEl = msgEl.querySelector('.msg-text');
            if (!textEl) return;
            const existing = msgEl.querySelector('.msg-translation');
            if (existing) { existing.remove(); return; }
            const target = localStorage.getItem('translateLang') || 'en';
            try {
              const r = await loadJSON('/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textEl.textContent, target }) });
              if (!r.success) { toast(r.message || 'Kunne ikke oversette'); return; }
              const div = document.createElement('div');
              div.className = 'msg-translation';
              div.textContent = '🌐 ' + r.translated;
              textEl.after(div);
            } catch(e) { toast('Kunne ikke oversette'); }
          }},
          ...(isOwn ? [{ icon: '✏️', label: 'Rediger', action: () => editMessage(msgId) }] : []),
          ...(activeChat && activeChat.type === 'user' ? [{ icon: '🗑️', label: 'Tøm samtale', action: () => {
            if (confirm('Slette alle meldinger?')) {
              fetch('/clear_messages/' + encodeURIComponent(activeChat.target), { method: 'POST' }).then(() => {
                messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Ingen meldinger</p></div>';
              }).catch(() => toast('Kunne ikke tømme samtale'));
            }
          }}] : []),
        ];

        actionDefs.forEach(a => {
          const extra = a.label === 'Tøm samtale' ? ' toem-samtale' : '';
          html += '<button class="ctx-item' + extra + '"><span>' + a.icon + '</span><span>' + a.label + '</span></button>';
        });
        html += '<div class="ctx-sep"></div>';
        html += '<button class="ctx-item danger"><span>🗑</span><span>Slett</span></button>';

        menu.innerHTML = html;

        menu.querySelectorAll('.ctx-reactions button').forEach(btn => {
          btn.addEventListener('click', (e) => { e.stopPropagation(); menu.remove(); toggleReaction(msgId, btn.dataset.emoji); });
        });
        menu.querySelectorAll('.ctx-item').forEach((btn, i) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.remove();
            if (btn.classList.contains('danger')) { showDeleteChoice(msgId, msgEl); return; }
            if (actionDefs[i]) actionDefs[i].action();
          });
        });

        document.body.appendChild(menu);

        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';

        setTimeout(() => {
          const close = (e) => {
            if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); }
          };
          document.addEventListener('click', close);
        }, 10);
      }

      function showReminderPicker(msgId) {
        const el = messagesBox.querySelector('.msg[data-msg-id="' + msgId + '"] .msg-text');
        const text = el ? el.textContent.trim().substring(0, 200) : 'Påminnelse';
        const overlay = document.createElement('div');
        overlay.className = 'reminder-picker-overlay';
        overlay.innerHTML = '<div class="reminder-picker"><h3>⏰ Påminn meg</h3>'
          + '<p class="reminder-picker-text">' + escapeHtml(text.substring(0, 80)) + '</p>'
          + '<button data-min="60">Om 1 time</button>'
          + '<button data-min="180">Om 3 timer</button>'
          + '<button data-min="1440">I morgen</button>'
          + '<button data-custom="1">Tilpasset (minutter)…</button>'
          + '<button class="cancel">Avbryt</button></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', async (e) => {
          if (e.target.classList.contains('reminder-picker-overlay') || e.target.classList.contains('cancel')) { overlay.remove(); return; }
          let minutes = e.target.dataset.min;
          if (e.target.dataset.custom) {
            const input = window.prompt('Påminn meg om (minutter):', '60');
            if (input === null) { overlay.remove(); return; }
            minutes = input.trim();
          }
          if (!minutes) { overlay.remove(); return; }
          try {
            await loadJSON('/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, minutes }) });
            toast('Påminnelse satt ✓', 'success');
          } catch (err) { toast('Kunne ikke sette påminnelse: ' + (err.message || '')); }
          overlay.remove();
        });
      }

      function renderReactionBadges(reactions) {
        const inverted = invertReactions(reactions);
        const entries = Object.entries(inverted);
        if (!entries.length) return '';
        const me = window.__APP__?.username || '';
        return '<div class="reaction-badges">' + entries.map(([emoji, users]) => {
          const iReacted = users.includes(me);
          return '<span class="reaction-badge' + (iReacted ? ' reacted' : '') + '" data-emoji="' + escapeHtml(emoji) + '">' + emoji + ' ' + users.length + '</span>';
        }).join('') + '</div>';
      }

      function appendMessage(message, chatId, parent) {
        const me = window.__APP__?.username || '';
        const isMe = message.sender === me;
        const renderedText = (() => {
          if (!isMe && message.type === 'text' && activeChat?.type === 'user' && activeChat?.peerPublicKey) {
            const text = decryptFromPeer(message.text, activeChat.peerPublicKey);
            return text;
          }
          if (!isMe && message.type === 'text' && activeChat?.type === 'group' && activeChat?.groupE2EEKey && message.e2ee) {
            try {
              const parts = String(message.text).split('.');
              if (parts.length === 2) {
                const iv = base64ToArrayBuffer(parts[0]);
                const enc = base64ToArrayBuffer(parts[1]);
                const dec = window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, activeChat.groupE2EEKey, enc);
                return dec.then(buf => new TextDecoder().decode(buf));
              }
            } catch (e) {}
            return '[Kunne ikke dekryptere]';
          }
          return message.text || '';
        })();

        if (typeof renderedText === 'string') {
          finishAppend(message, chatId, isMe, renderedText, parent);
        } else {
          renderedText.then(text => finishAppend(message, chatId, isMe, text, parent)).catch(() => finishAppend(message, chatId, isMe, '[Dekrypteringsfeil]', parent));
        }
      }

      // ── App Lock ──
      function checkAppLock() {
        const pin = localStorage.getItem('app-pin');
        if (!pin) return;
        const locked = sessionStorage.getItem('app-locked');
        if (locked !== 'unlocked') showLockScreen();
      }
      function showLockScreen() {
        const overlay = document.createElement('div');
        overlay.id = 'appLockOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:#0e1621;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
        const hasPin = !!localStorage.getItem('app-pin');
        overlay.innerHTML = '<div style="font-size:2.5rem;">🔐</div>'
          + '<div style="color:#e7e8f3;font-size:1.1rem;font-weight:600;">' + (hasPin ? 'Skriv inn PIN' : 'Sett PIN-kode') + '</div>'
          + '<input id="lockPinInput" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]*" placeholder="' + (hasPin ? 'PIN-kode' : 'Ny PIN (4-6 siffer)') + '" style="width:200px;padding:10px;border-radius:10px;border:none;background:#17213b;color:#fff;text-align:center;font-size:1.2rem;letter-spacing:4px;outline:2px solid #3390ec;" />'
          + '<div id="lockError" style="color:#ff6b6b;font-size:.85rem;display:none;"></div>'
          + '<button id="lockSubmitBtn" style="background:#3390ec;border:none;border-radius:10px;color:#fff;padding:10px 30px;cursor:pointer;font-size:.95rem;">' + (hasPin ? 'Lås opp' : 'Lagre PIN') + '</button>'
          + (hasPin ? '<button id="lockUnsetBtn" style="background:transparent;border:none;color:#6d8094;cursor:pointer;font-size:.8rem;">Fjern PIN</button>' : '');
        document.body.appendChild(overlay);
        document.getElementById('lockPinInput').focus();
        document.getElementById('lockPinInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('lockSubmitBtn').click(); });
        document.getElementById('lockSubmitBtn')?.addEventListener('click', () => {
          const val = document.getElementById('lockPinInput').value.trim();
          const err = document.getElementById('lockError');
          if (hasPin) {
            if (val === localStorage.getItem('app-pin')) {
              sessionStorage.setItem('app-locked', 'unlocked');
              overlay.remove();
            } else {
              err.textContent = 'Feil PIN-kode';
              err.style.display = 'block';
              document.getElementById('lockPinInput').value = '';
            }
          } else {
            if (val.length < 4) { err.textContent = 'PIN må være minst 4 siffer'; err.style.display = 'block'; return; }
            localStorage.setItem('app-pin', val);
            sessionStorage.setItem('app-locked', 'unlocked');
            overlay.remove();
            toast('PIN-kode satt', 'success');
          }
        });
        document.getElementById('lockUnsetBtn')?.addEventListener('click', () => {
          if (confirm('Fjerne PIN-kode?')) {
            localStorage.removeItem('app-pin');
            sessionStorage.removeItem('app-locked');
            overlay.remove();
            toast('PIN fjernet', 'success');
          }
        });
      }

      // ── Stealth mode ──
      let stealthMode = localStorage.getItem('stealth-mode') === 'true';
      function toggleStealthMode() {
        stealthMode = !stealthMode;
        localStorage.setItem('stealth-mode', stealthMode);
        document.body.classList.toggle('stealth-mode', stealthMode);
        document.getElementById('stealthToggle').textContent = stealthMode ? '🕵️' : '👁️';
        toast(stealthMode ? 'Stealth-modus på — varsler skjult' : 'Stealth-modus av', 'success');
      }

      function finishAppend(message, chatId, isMe, renderedText, parent) {
        if (message.deleted) renderedText = '🗑️ [Melding slettet]';
        const box = parent || messagesBox;

        const item = document.createElement('div');
        item.className = 'msg ' + (isMe ? 'sent' : 'received') + (message.deleted ? ' deleted-msg' : '') + (message.edited ? ' edited' : '') + (message.effect ? ' msg-effect ' + message.effect : '');
        if (message.id) item.dataset.messageId = message.id;
        item.dataset.msgId = message.id || '';

        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (message.deleted) return;
          showQuickActions(item, e.clientX, e.clientY);
        });

        let _longPressTimer;
        item.addEventListener('touchstart', (e) => {
          item.classList.add('touching');
          _longPressTimer = setTimeout(() => {
            item.classList.remove('touching');
            if (message.id) {
              toggleMessageSelection(item, message.id);
            }
          }, 500);
        });
        item.addEventListener('touchend', () => { item.classList.remove('touching'); clearTimeout(_longPressTimer); });
        item.addEventListener('touchmove', () => { item.classList.remove('touching'); clearTimeout(_longPressTimer); });

        let fileHtml = '';
        if (message.type === 'file' && !message.deleted) {
          const isImage = /\.(png|jpe?g|gif|webp)$/i.test(message.filename || '');
          if (isImage) {
            fileHtml = '<div class="inline-image"><img src="/uploads/' + encodeURIComponent(message.filename) + '" alt="' + escapeHtml(message.filename || 'bilde') + '" /></div>';
          } else if (/\.(mp4|webm|mov|avi|mkv|ogg)$/i.test(message.filename || '')) {
            fileHtml = '<div class="inline-video"><video src="/uploads/' + encodeURIComponent(message.filename) + '" controls preload="metadata" style="max-width:100%;max-height:300px;border-radius:12px;"></video></div>';
          } else if (/\.pdf$/i.test(message.filename || '')) {
            fileHtml = '<div class="pdf-preview" data-pdf-url="/uploads/' + encodeURIComponent(message.filename) + '"><div class="pdf-icon">📄</div><div class="pdf-name">' + escapeHtml(message.filename || 'dokument.pdf') + '</div><div class="pdf-open">Åpne</div></div>';
          } else {
            const audioExts = ['.webm', '.mp3', '.ogg', '.wav', '.opus', '.m4a'];
            const isVoice = message.filename && audioExts.some(ext => message.filename.toLowerCase().endsWith(ext));
            if (isVoice) {
              fileHtml = '<div class="voice-msg-player" data-src="/uploads/' + encodeURIComponent(message.filename) + '"><button class="voice-play-btn">▶</button><canvas class="voice-waveform" width="200" height="40"></canvas><span class="voice-duration">0:00</span></div>';
            } else {
              fileHtml = '<div class="badge">📎 ' + escapeHtml(message.filename || 'fil') + '</div>';
            }
          }
        } else if (message.type === 'file_e2ee' && !message.deleted && message.text) {
          fileHtml = '<div class="file-e2ee-loading" style="padding:8px 0;">🔒 Dekrypterer fil...</div>';
          (async () => {
            try {
              let b64;
              if (activeChat?.type === 'user' && activeChat?.peerPublicKey) {
                b64 = await decryptFromPeer(message.text, activeChat.peerPublicKey);
              } else if (activeChat?.type === 'group' && activeChat?.groupE2EEKey && message.e2ee) {
                const parts = String(message.text).split('.');
                if (parts.length === 2) {
                  const iv = base64ToArrayBuffer(parts[0]);
                  const enc = base64ToArrayBuffer(parts[1]);
                  const buf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, activeChat.groupE2EEKey, enc);
                  b64 = new TextDecoder().decode(buf);
                }
              }
              if (b64) {
                const raw = base64ToArrayBuffer(b64);
                const blob = new Blob([raw], { type: message.mimeType || '' });
                const url = URL.createObjectURL(blob);
                const container = item.querySelector('.file-e2ee-loading');
                if (container) {
                  const ext = (message.filename || '').toLowerCase();
                  if (/\.(png|jpe?g|gif|webp)$/i.test(ext)) {
                    container.outerHTML = '<div class="inline-image"><img src="' + url + '" alt="' + escapeHtml(message.filename || 'bilde') + '" /></div>';
                  } else if (/\.(mp4|webm|mov|avi|mkv|ogg)$/i.test(ext)) {
                    container.outerHTML = '<div class="inline-video"><video src="' + url + '" controls preload="metadata" style="max-width:100%;max-height:300px;border-radius:12px;"></video></div>';
                  } else if (/\.pdf$/i.test(ext)) {
                    container.outerHTML = '<div class="pdf-preview" data-pdf-url="' + url + '"><div class="pdf-icon">📄</div><div class="pdf-name">' + escapeHtml(message.filename || 'dokument.pdf') + '</div><div class="pdf-open">Åpne</div></div>';
                  } else {
                    const audioExts = ['.webm', '.mp3', '.ogg', '.wav', '.opus', '.m4a'];
                    if (message.filename && audioExts.some(a => ext.endsWith(a))) {
                      container.outerHTML = '<div class="voice-msg-player" data-src="' + url + '"><button class="voice-play-btn">▶</button><canvas class="voice-waveform" width="200" height="40"></canvas><span class="voice-duration">0:00</span></div>';
                    } else {
                      container.outerHTML = '<div class="badge">📎 <a href="' + url + '" download="' + escapeHtml(message.filename || 'fil') + '">' + escapeHtml(message.filename || 'fil') + '</a></div>';
                    }
                  }
                }
              }
            } catch (e) {
              const container = item.querySelector('.file-e2ee-loading');
              if (container) container.outerHTML = '<div style="color:#ff6b6b;padding:8px 0;">🔒 Kunne ikke dekryptere fil</div>';
            }
          })();
        }

        const e2eeIndicator = (!isMe && (message.type === 'text' || message.type === 'file_e2ee') && activeChat?.type === 'user' && activeChat?.peerPublicKey)
          ? '<span class="e2ee">🔒 E2EE</span> '
          : '';

        let tagHtml = '';
        if (message.edited) tagHtml += '<div class="edited-tag">[Redigert]</div>';
        if (message.deleted) tagHtml += '<div class="deleted-tag">[Slettet]</div>';
        if (message.silent) tagHtml += '<div class="edited-tag">🔇 Lydløs</div>';

        const reactionsHtml = renderReactionBadges(message.reactions);

        let actionsHtml = '';
        if (isMe && !message.deleted && message.id) {
          actionsHtml = '<div class="msg-actions">'
            + '<button class="msg-action-btn edit-btn" title="Rediger">✏️</button>'
            + '<button class="msg-action-btn delete-btn" title="Slett">🗑️</button>'
            + '<button class="msg-action-btn fwd-btn" title="Videresend">↪</button>'
            + '</div>';
        } else if (!isMe && !message.deleted && message.id) {
          actionsHtml = '<div class="msg-actions">'
            + '<button class="msg-action-btn save-msg-btn" title="Lagre">📌</button>'
            + '<button class="msg-action-btn fwd-btn" title="Videresend">↪</button>'
            + '</div>';
        }

        const senderDisplay = getDisplayName(message.sender || '');
        const msgDate = message.timestamp ? new Date(message.timestamp) : null;
        const dateKey = msgDate ? msgDate.toLocaleDateString('no-NO') : '';
        const prevItem = chatId ? box.children[box.children.length - 1] : null;
        const prevDate = prevItem?.dataset?.dateKey;
        const showDateSeparator = !!chatId && !!dateKey && prevDate !== dateKey;
        const shortTime = msgDate ? new Intl.DateTimeFormat('no-NO', { hour:'2-digit', minute:'2-digit' }).format(msgDate) : '';
        const fullTime = msgDate ? new Intl.DateTimeFormat('no-NO', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(msgDate) : '';

        const replyHtml = message.reply_preview ? '<div class="reply-ref" data-reply-to="' + escapeHtml(message.reply_to || '') + '">&#8617; ' + escapeHtml(message.reply_preview) + '</div>' : '';
        const replyBtnHtml = (!isMe && !message.deleted && message.id) ? '<button class="reply-msg-btn" title="Svar">&#8617;</button>' : '';
        const fwdTag = message.forwarded_from ? '<div class="forwarded-tag">↪ Videresendt fra ' + escapeHtml(message.forwarded_from) + '</div>' : '';

        const pollHtml = (message.type === 'poll' && message.poll_id) ? '<div class="poll-placeholder" data-poll-id="' + escapeHtml(message.poll_id) + '">Laster avstemning...</div>' : '';
        const msgTextHtml = (message.type === 'poll' && message.poll_id) ? '' : '<div class="msg-text">' + (message.deleted ? '' : escapeHtml(renderedText)) + '</div>';

        if (showDateSeparator) {
          item.dataset.dateKey = dateKey;
          const sep = document.createElement('div');
          sep.className = 'date-separator';
          sep.innerHTML = '<span>' + escapeHtml(dateKey) + '</span>';
          box.appendChild(sep);
        }

        item.innerHTML = (
          (activeChat?.type === 'group' && !isMe ? '<div class="msg-sender">' + escapeHtml(senderDisplay) + '</div>' : '')
          + fwdTag
          + replyHtml
          + fileHtml
          + pollHtml
          + msgTextHtml
          + '<div class="msg-footer">'
          + tagHtml
          + '<span class="time" title="' + escapeHtml(fullTime) + '">' + escapeHtml(shortTime) + '</span>'
          + (isMe ? '<span class="read">' + (message.read ? '<span class="read-receipt read">✓✓</span>' : '<span class="read-receipt unread">✓</span>') + '</span>' : '')
          + '</div>'
          + reactionsHtml
          + actionsHtml
          + (message.id && !message.deleted ? '<button class="reaction-trigger" title="Reager">+</button>' : '')
        );

        const reactionTrigger = item.querySelector('.reaction-trigger');
        if (reactionTrigger) {
          reactionTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            showEmojiPicker(item, message.id);
          });
        }

        const editBtn = item.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editMessage(message.id);
          });
        }

        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMessage(message.id);
          });
        }

        const fwdBtn = item.querySelector('.fwd-btn');
        if (fwdBtn) {
          fwdBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            forwardMsg(message.id);
          });
        }

        const saveMsgBtn = item.querySelector('.save-msg-btn');
        if (saveMsgBtn) {
          saveMsgBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            saveMsgToSelf(message.id);
          });
        }

        item.querySelectorAll('.reaction-badge').forEach(badge => {
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = badge.dataset.emoji;
            if (emoji && message.id) toggleReaction(message.id, emoji);
          });
        });

        if (message.type === 'poll' && message.poll_id) {
          loadPoll(message.poll_id).then(poll => {
            const ph = item.querySelector('.poll-placeholder');
            if (ph && poll) {
              ph.outerHTML = renderPollCard(poll);
              item.querySelectorAll('.poll-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                  e.stopPropagation();
                  votePoll(message.poll_id, [parseInt(opt.dataset.idx)]);
                });
              });
            }
          });
        }

        box.appendChild(item);
        if (!userScrolledUp) messagesBox.scrollTop = messagesBox.scrollHeight;
      }

      async function postTextMessage(text) {
        if (activeChat.type === 'channel') {
          const url = '/channels/' + encodeURIComponent(activeChat.target) + '/send';
          const body = { ciphertext: text, type: 'text' };
          if (silentMode) body.silent = true;
          if (replyingTo) body.reply_to = replyingTo.id;
          await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const item = document.createElement('div');
          item.className = 'msg sent';
          item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(window.__APP__?.username || '') + '</span><span class="time">' + escapeHtml(formatTime(new Date().toISOString())) + '</span></div>'
            + '<div class="text">' + escapeHtml(text) + '</div>';
          messagesBox.appendChild(item);
          messagesBox.scrollTop = messagesBox.scrollHeight;
        } else if (activeChat.type === 'user' || activeChat.type === 'group') {
          const url = activeChat.type === 'group' ? '/groups/' + encodeURIComponent(activeChat.target) + '/send' : '/send';
          const body = { ciphertext: text };
          if (silentMode) body.silent = true;
          if (activeChat.type === 'user') {
            const ciphertext = await encryptForPeer(text, activeChat.peerPublicKey);
            body.ciphertext = ciphertext;
            body.recipient = activeChat.target;
          } else if (activeChat.type === 'group' && activeChat.groupE2EEKey) {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const enc = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, activeChat.groupE2EEKey, new TextEncoder().encode(text));
            body.ciphertext = arrayBufferToBase64(iv) + '.' + arrayBufferToBase64(enc);
            body.e2ee = true;
          }
          if (replyingTo) body.reply_to = replyingTo.id;
          if (window._disappearMinutes && activeChat.type === 'user') body.self_destruct_minutes = window._disappearMinutes;
          if (window._selectedEffect) { body.effect = window._selectedEffect; window._selectedEffect = null; }
          await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        }
      }

      async function sendAiMessage(prompt) {
        const bubble = document.createElement('div');
        bubble.className = 'msg ai-thinking';
        bubble.innerHTML = '<div class="text"><span class="ai-dots">🤖 AI tenker<span>.</span><span>.</span><span>.</span></span></div>';
        messagesBox.appendChild(bubble);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        try {
          const data = await loadJSON('/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
          if (data.success && data.reply) {
            await postTextMessage(data.reply);
          } else {
            toast(data.message || 'AI svarte ikke', 'info');
          }
        } catch (e) {
          toast('AI er utilgjengelig: ' + (e.message || ''));
        } finally {
          if (bubble.parentElement) bubble.remove();
        }
      }

      async function sendMessage() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const sendBtn = document.getElementById('sendBtn');
        if (!input || !activeChat) return;
        input.disabled = true;
        sendBtn.disabled = true;
        const text = (input.value || '').trim();
        const file = droppedFile || (fileInput && fileInput.files && fileInput.files[0]);
        droppedFile = null;
        if (!text && !file) { input.disabled = false; return; }
        try {
          const aiMatch = text.match(/^\/ai(?:\s+(.+))?$/s);
          if (aiMatch && !file) {
            input.value = '';
            updateSendButton();
            const prompt = (aiMatch[1] || '').trim();
            if (!prompt) { toast('Bruk: /ai <spørsmål>', 'info'); input.disabled = false; sendBtn.disabled = false; return; }
            await sendAiMessage(prompt);
            return;
          }
          if (file) {
            if (activeChat.type === 'user' && activeChat.peerPublicKey) {
              const buf = await file.arrayBuffer();
              const b64 = arrayBufferToBase64(buf);
              const ciphertext = await encryptForPeer(b64, activeChat.peerPublicKey);
              const body = { ciphertext, type: 'file_e2ee', filename: file.name, mimeType: file.type, recipient: activeChat.target };
              if (replyingTo) body.reply_to = replyingTo.id;
              await fetch('/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            } else if (activeChat.type === 'group' && activeChat.groupE2EEKey) {
              const buf = await file.arrayBuffer();
              const b64 = arrayBufferToBase64(buf);
              const iv = window.crypto.getRandomValues(new Uint8Array(12));
              const enc = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, activeChat.groupE2EEKey, new TextEncoder().encode(b64));
              const ciphertext = arrayBufferToBase64(iv) + '.' + arrayBufferToBase64(enc);
              const body = { ciphertext, type: 'file_e2ee', filename: file.name, mimeType: file.type, e2ee: true };
              if (replyingTo) body.reply_to = replyingTo.id;
              await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            } else {
              const form = new FormData();
              form.append('file', file);
              if (activeChat.type === 'user') form.append('recipient', activeChat.target); else form.append('groupId', activeChat.target);
              await fetch('/upload', { method: 'POST', body: form });
            }
          } else {
            await postTextMessage(text);
          }

          input.value = '';
          clearImagePreview();
          replyingTo = null;
          const replyBar = document.getElementById('replyBar');
          if (replyBar) replyBar.style.display = 'none';
          if (fileInput) fileInput.value = '';
          if (activeChat.type === 'user') await loadChat(activeChat.target);
          else if (activeChat.type === 'group') await loadGroup(activeChat.target);
          else if (activeChat.type === 'channel') await openChannel(activeChat.target);
        } catch (e) {
          toast('Kunne ikke sende: ' + e.message);
        } finally {
          input.disabled = false;
          sendBtn.disabled = !((input.value || '').trim() || droppedFile || (fileInput && fileInput.files && fileInput.files[0]));
        }
      }

      function updateSendButton() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const sendBtn = document.getElementById('sendBtn');
        if (!input || !sendBtn) return;
        const text = (input.value || '').trim();
        const file = droppedFile || (fileInput && fileInput.files && fileInput.files[0]);
        sendBtn.disabled = !(text || file);
      }

      function clearImagePreview() {
        if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.innerHTML = ''; }
      }

      function showImagePreview(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.innerHTML = '<div class="img-preview"><img src="' + e.target.result + '" /><button class="remove-preview">&times;</button></div>';
          imagePreview.style.display = 'flex';
          imagePreview.querySelector('.remove-preview').addEventListener('click', () => {
            clearImagePreview();
            droppedFile = null;
            const fi = document.getElementById('fileInput');
            if (fi) fi.value = '';
            updateSendButton();
          });
        };
        reader.readAsDataURL(file);
      }

      if (messagesBox) {
        let scrollThrottle = null;
        messagesBox.addEventListener('scroll', () => {
          const container = messagesBox;
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
          userScrolledUp = distanceFromBottom > 100;
          if (container.scrollTop < 100 && activeChat && activeChat.type === 'user') {
            if (!scrollThrottle) {
              scrollThrottle = setTimeout(() => { scrollThrottle = null; }, 300);
              loadOlderMessages();
            }
          }
        });
      }

      function handleTypingInput() {
        if (!activeChat) return;
        if (!isTyping) {
          isTyping = true;
          fetch('/typing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: activeChat.target, typing: true })
          }).catch(() => {});
        }
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          isTyping = false;
          fetch('/typing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: activeChat.target, typing: false })
          }).catch(() => {});
        }, 3000);
      }

      async function checkTypingIndicator() {
        if (!activeChat) return;
        const el = document.getElementById('typingIndicator');
        if (!el) return;
        try {
          const data = await loadJSON('/typing/' + encodeURIComponent(activeChat.target));
          const typers = data.typers || [];
          if (typers.length === 0) {
            el.textContent = '';
            el.style.display = 'none';
          } else if (typers.length === 1) {
            el.textContent = typers[0] + ' skriver...';
            el.style.display = '';
          } else if (typers.length === 2) {
            el.textContent = typers[0] + ' og ' + typers[1] + ' skriver...';
            el.style.display = '';
          } else {
            el.textContent = typers[0] + ' og ' + (typers.length - 1) + ' flere skriver...';
            el.style.display = '';
          }
        } catch (e) {
          el.style.display = 'none';
        }
      }

      document.getElementById('sendBtn').addEventListener('click', sendMessage);
      document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (sendOnEnter && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          if (!sendOnEnter && e.shiftKey) { e.preventDefault(); sendMessage(); }
        }
      });
      document.getElementById('messageInput').addEventListener('input', () => {
        updateSendButton();
        handleTypingInput();
      });
      document.getElementById('messageInput').addEventListener('input', function emojiAutocomplete() {
        const el = this;
        const val = el.value;
        const cursorPos = el.selectionStart;
        const match = val.slice(0, cursorPos).match(/:(\w+):$/);
        if (match && EMOJI_MAP[':' + match[1] + ':']) {
          const emoji = EMOJI_MAP[':' + match[1] + ':'];
          const before = val.slice(0, cursorPos - match[0].length);
          const after = val.slice(cursorPos);
          el.value = before + emoji + after;
          const newPos = before.length + emoji.length;
          el.setSelectionRange(newPos, newPos);
        }
      });
      document.getElementById('fileInput').addEventListener('change', (e) => {
        updateSendButton();
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) showImagePreview(file);
      });

      document.getElementById('cancelReply').addEventListener('click', () => {
        replyingTo = null;
        document.getElementById('replyBar').style.display = 'none';
      });

      messagesBox.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG' && e.target.parentElement) {
          e.target.parentElement.innerHTML = '<div class="badge">📎 ' + (e.target.alt || 'bilde') + '</div>';
        }
      }, true);

      messagesBox.addEventListener('click', (e) => {
        const btn = e.target.closest('.reply-msg-btn');
        if (!btn) return;
        const msgEl = btn.closest('.msg');
        if (!msgEl) return;
        const mid = msgEl.dataset.msgId;
        const sender = msgEl.querySelector('.sender')?.textContent || '';
        const textEl = msgEl.querySelector('.msg-text');
        const text = textEl ? textEl.textContent : '';
        replyingTo = { id: mid, sender, text };
        document.getElementById('replyBar').style.display = 'flex';
        document.getElementById('replyBarName').textContent = sender;
        document.getElementById('replyBarPreview').textContent = text.substring(0, 60);
        document.getElementById('messageInput').focus();
      });

      // ── Voice messages ──
      let mediaRecorder = null;
      let audioChunks = [];
      let isRecording = false;

      const voiceBtn = document.getElementById('voiceRecordBtn');
      if (voiceBtn) {
        voiceBtn.addEventListener('click', async () => {
          if (isRecording) {
            stopRecording();
            return;
          }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = async () => {
              stream.getTracks().forEach(t => t.stop());
              const blob = new Blob(audioChunks, { type: 'audio/webm' });
              await sendVoiceMessage(blob);
            };
            mediaRecorder.start();
            isRecording = true;
            voiceBtn.textContent = '⏹️';
            voiceBtn.classList.add('recording');
          } catch (e) {
            toast('Kunne ikke starte opptak: ' + e.message);
          }
        });
      }

      function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        isRecording = false;
        const btn = document.getElementById('voiceRecordBtn');
        if (btn) { btn.textContent = '🎙️'; btn.classList.remove('recording'); }
      }

      let dictationActive = false;
      let dictationRecognition = null;
      const dictateBtn = document.getElementById('dictateBtn');
      if (dictateBtn) {
        dictateBtn.addEventListener('click', () => {
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SR) { toast('Tale-gjenkjenning støttes ikke i denne nettleseren'); return; }
          const input = document.getElementById('messageInput');
          if (dictationActive) {
            dictationActive = false;
            if (dictationRecognition) dictationRecognition.stop();
            dictateBtn.style.color = '';
            dictateBtn.style.background = '';
            toast('Diktat stoppet');
            return;
          }
          const rec = new SR();
          dictationRecognition = rec;
          rec.lang = localStorage.getItem('dictationLang') || 'nb-NO';
          rec.interimResults = true;
          rec.continuous = true;
          let finalTranscript = (input && input.value ? input.value : '');
          let hadResult = false;
          dictationActive = true;
          dictateBtn.style.color = 'var(--c-primary)';
          dictateBtn.style.background = 'rgba(91,141,239,0.15)';
          toast('🎤 Lytt... klikk 🎤 igjen for å stoppe');
          rec.onresult = (e) => {
            hadResult = true;
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const r = e.results[i];
              if (r.isFinal) finalTranscript += (finalTranscript ? ' ' : '') + r[0].transcript;
              else interim += r[0].transcript;
            }
            if (input) input.value = finalTranscript + (interim ? ' ' + interim : '');
          };
          rec.onerror = (e) => {
            dictationActive = false;
            dictateBtn.style.color = '';
            dictateBtn.style.background = '';
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Ingen mikrofontilgang');
            else if (e.error !== 'aborted') toast('Diktatfeil: ' + e.error);
          };
          rec.onend = () => {
            dictationActive = false;
            dictateBtn.style.color = '';
            dictateBtn.style.background = '';
            if (hadResult) toast('Diktat ferdig', 'success');
          };
          try {
            rec.start();
          } catch (e) {
            dictationActive = false;
            toast('Kunne ikke starte diktat');
          }
        });
      }

      async function sendVoiceMessage(blob) {
        if (!activeChat || blob.size < 100) return;
        const form = new FormData();
        const filename = 'voice-' + Date.now() + '.webm';
        form.append('file', blob, filename);
        if (activeChat.type === 'user') form.append('recipient', activeChat.target); else form.append('groupId', activeChat.target);
        try {
          if (activeChat.type === 'group') {
            const uploadForm = new FormData();
            uploadForm.append('file', blob, filename);
            uploadForm.append('groupId', activeChat.target);
            const uploadRes = await fetch('/upload', { method: 'POST', body: uploadForm });
            const uploadData = await uploadRes.json();
            const uploadedFilename = uploadData.filename || filename;
            await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: uploadedFilename, type: 'voice', filename: uploadedFilename }) });
          } else {
            await fetch('/upload', { method: 'POST', body: form });
          }
          toast('Talebeskjed sendt', 'success');
          if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke sende talebeskjed');
        }
      }

      function setupDragDrop() {
        const chatMain = document.querySelector('.chat-main');
        if (!chatMain) return;
        chatMain.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            dropOverlay.style.display = 'flex';
          }
        });
        chatMain.addEventListener('dragleave', (e) => {
          e.stopPropagation();
          if (!chatMain.contains(e.relatedTarget)) {
            dropOverlay.style.display = 'none';
          }
        });
        chatMain.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropOverlay.style.display = 'none';
          const files = e.dataTransfer.files;
          if (files && files.length > 0 && composer.style.display !== 'none') {
            const file = files[0];
            droppedFile = file;
            updateSendButton();
            if (file.type.startsWith('image/')) showImagePreview(file);
          }
        });
      }
      setupDragDrop();

      function highlightSearch(text, query) {
        if (!query) return text;
        const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return text.replace(re, '<mark style="background:var(--c-accent);color:#fff;border-radius:2px;padding:0 2px;">$1</mark>');
      }

      document.getElementById('searchBtn').addEventListener('click', async () => {
        const q = document.getElementById('searchInput').value.trim();
        const partner = document.getElementById('searchPartner').value.trim();
        const dateFrom = document.getElementById('searchDateFrom').value;
        const dateTo = document.getElementById('searchDateTo').value;
        if (!q && !partner && !dateFrom) { toast('Skriv inn søketekst'); return; }
        let url = '/search/v2?q=' + encodeURIComponent(q);
        if (partner) url += '&partner=' + encodeURIComponent(partner);
        if (dateFrom) url += '&from=' + encodeURIComponent(dateFrom);
        if (dateTo) url += '&to=' + encodeURIComponent(dateTo + 'T23:59:59');
        messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div><div class="skeleton-msg skeleton-received"></div></div>';
        try {
          const data = await loadJSON(url);
          const results = data.results || data.messages || [];
          messagesBox.innerHTML = '';
          if (!results.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Ingen treff for "' + escapeHtml(q) + '"</p></div>';
            return;
          }
          const header = document.createElement('div');
          header.className = 'search-results-header';
          header.innerHTML = '<span class="count">' + results.length + ' treff</span><button class="close-search" id="closeSearchResults">✕</button>';
          messagesBox.appendChild(header);
          document.getElementById('closeSearchResults').addEventListener('click', () => {
            if (activeChat?.type === 'user') openChat(activeChat.target);
            else if (activeChat?.type === 'group') openGroup(activeChat.target);
            else messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><h3>Ingen samtale valgt</h3><p>Velg en kontakt eller gruppe.</p></div>';
          });
          results.slice(0, 50).forEach(r => {
            const item = document.createElement('div');
            item.className = 'msg ' + (r.sender === (window.__APP__?.username || '') ? 'sent' : 'received');
            const chatName = r.group_id || r.channel_id || r.recipient || r.sender || '';
            const senderDisplay = getDisplayName(r.sender || '');
            item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(senderDisplay) + ' → ' + escapeHtml(chatName) + '</span><span class="time">' + escapeHtml(formatTime(r.timestamp)) + '</span></div>'
              + '<div class="msg-text">' + highlightSearch(escapeHtml((r.text || r.filename || '').slice(0, 200)), q) + '</div>';
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
              if (r.group_id) openGroup(r.group_id);
              else if (r.channel_id) openChannel(r.channel_id);
              else openChat(r.sender === (window.__APP__?.username || '') ? r.recipient : r.sender);
            });
            messagesBox.appendChild(item);
          });
          toast(results.length + ' treff', 'success');
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Søk feilet – prøver gammel søk...</p></div>';
          try {
            let allResults = [];
            if (partner) {
              const d2 = await loadJSON('/search?q=' + encodeURIComponent(q) + '&partner=' + encodeURIComponent(partner));
              allResults = (d2.messages || []).map(m => ({ ...m, _partner: partner }));
            } else if (q) {
              const usersData = await loadJSON('/users');
              const userList = usersData.users || [];
              const searches = userList.map(u => {
                const name = typeof u === 'string' ? u : u.username;
                return loadJSON('/search?q=' + encodeURIComponent(q) + '&partner=' + encodeURIComponent(name)).then(d => (d.messages || []).map(m => ({ ...m, _partner: name }))).catch(() => []);
              });
              const res = await Promise.all(searches);
              allResults = res.flat();
            }
            allResults.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
            messagesBox.innerHTML = '';
            if (allResults.length) {
              const hdr = document.createElement('div');
              hdr.className = 'search-results-header';
              hdr.innerHTML = '<span class="count">' + allResults.length + ' treff</span><button class="close-search" id="closeSearchResults">✕</button>';
              messagesBox.appendChild(hdr);
              document.getElementById('closeSearchResults').addEventListener('click', () => {
                if (activeChat?.type === 'user') openChat(activeChat.target);
                else if (activeChat?.type === 'group') openGroup(activeChat.target);
              });
              allResults.forEach(m => {
                const item = document.createElement('div');
                item.className = 'msg ' + (m.sender === (window.__APP__?.username || '') ? 'sent' : 'received');
                const sd = getDisplayName(m.sender || '');
                item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(sd) + '</span><span class="time">' + escapeHtml(formatTime(m.timestamp)) + '</span></div>'
                  + '<div class="msg-text">' + escapeHtml(m.text || m.filename || '') + '</div>';
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => { openChat(m._partner); });
                messagesBox.appendChild(item);
              });
              toast(allResults.length + ' treff (fallback)', 'success');
            } else {
              messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Ingen treff for "' + escapeHtml(q) + '"</p></div>';
            }
          } catch (e2) { toast('Søk feilet'); }
        }
      });

      ['searchInput','searchPartner','searchDateFrom','searchDateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('searchBtn').click(); });
      });

      document.getElementById('fileSearchBtn').addEventListener('click', async () => {
        const query = prompt('Soek i filnavn:');
        if (!query) return;
        messagesBox.innerHTML = '<div class="skeleton-loader"><div class="skeleton-msg skeleton-sent"></div></div>';
        try {
          const data = await loadJSON('/search/files?q=' + encodeURIComponent(query));
          messagesBox.innerHTML = '';
          const files = data.files || [];
          if (!files.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">📎</div><p>Ingen filer for "' + escapeHtml(query) + '"</p></div>';
            return;
          }
          const header = document.createElement('div');
          header.className = 'search-results-header';
          header.innerHTML = '<span class="count">' + files.length + ' filer funnet</span><button class="close-search" id="closeFileResults">✕</button>';
          messagesBox.appendChild(header);
          document.getElementById('closeFileResults').addEventListener('click', () => {
            if (activeChat?.type === 'user') openChat(activeChat.target);
            else if (activeChat?.type === 'group') openGroup(activeChat.target);
            else messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><h3>Ingen samtale valgt</h3></div>';
          });
          files.forEach(f => {
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(f.filename);
            const isAudio = /\.(webm|mp3|ogg|wav|opus|m4a)$/i.test(f.filename);
            const icon = isImage ? '🖼️' : isAudio ? '🎵' : '📄';
            const item = document.createElement('div');
            item.className = 'file-search-result';
            item.innerHTML = '<div class="file-icon">' + icon + '</div>'
              + '<div class="file-info"><div class="file-name">' + escapeHtml(f.filename) + '</div>'
              + '<div class="file-meta">' + escapeHtml(f.sender) + ' → ' + escapeHtml(f.recipient) + ' · ' + escapeHtml(formatTime(f.timestamp)) + '</div></div>';
            item.addEventListener('click', () => openChat(f.recipient === (window.__APP__?.username || '') ? f.sender : f.recipient));
            messagesBox.appendChild(item);
          });
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Filsøk feilet</p></div>';
        }
      });

      function showEmojiPicker(msgEl, messageId) {
        document.querySelectorAll('.emoji-picker-popup').forEach(el => el.remove());
        const picker = document.createElement('div');
        picker.className = 'emoji-picker-popup';
        ['👍','❤️','😂','😮','😢','😡','🎉','🔥','👏','💯','👀','🤔','😍','🙏','💀','🫡'].forEach(emoji => {
          const btn = document.createElement('button');
          btn.className = 'emoji-pick';
          btn.textContent = emoji;
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            toggleReaction(messageId, emoji);
            picker.remove();
          });
          picker.appendChild(btn);
        });
        const moreBtn = document.createElement('button');
        moreBtn.className = 'emoji-pick';
        moreBtn.textContent = '…';
        moreBtn.style.fontSize = '1.2rem';
        moreBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          picker.remove();
          currentReactionTarget = messageId;
          const fullPicker = document.getElementById('fullEmojiPicker');
          if (fullPicker) fullPicker.classList.add('open');
        });
        picker.appendChild(moreBtn);
        msgEl.appendChild(picker);
        setTimeout(() => {
          const close = (ev) => {
            if (!picker.contains(ev.target)) { picker.remove(); document.removeEventListener('click', close); }
          };
          document.addEventListener('click', close);
        }, 10);
      }

      // ── Full Emoji Picker ──
      function getFrequentEmojis() {
        try { return JSON.parse(localStorage.getItem('freqEmojis') || '[]'); } catch(e) { return []; }
      }
      function addFrequentEmoji(emoji) {
        let freq = getFrequentEmojis();
        freq = freq.filter(e => e !== emoji);
        freq.unshift(emoji);
        if (freq.length > 30) freq = freq.slice(0, 30);
        localStorage.setItem('freqEmojis', JSON.stringify(freq));
      }
      const EMOJI_DATA = {
        'Frekvent': getFrequentEmojis(),
        'Smiley': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
        'Gest': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏'],
        'Nature': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊'],
        'Food': ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
        'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','🪂','🎯','🪩','🎮','🕹️','🎰','🎲'],
        'Objects': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔩','⚙️','🗜️','⛏️','🛠️','⚒️','🔨','🪚','🔗','⛓️','🪝','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟','🛍️','🛒','🎁','🎈','🎏','🪅','🎊','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'],
        'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢']
      };
      const EMOJI_CATEGORIES = Object.keys(EMOJI_DATA);
      let currentEmojiCategory = 'Smiley';
      let currentReactionTarget = null;

      function initFullEmojiPicker() {
        const toggleBtn = document.getElementById('emojiToggleBtn');
        const picker = document.getElementById('fullEmojiPicker');
        const searchInput = document.getElementById('emojiSearch');
        const categoriesEl = document.getElementById('emojiCategories');
        const gridEl = document.getElementById('emojiGrid');
        if (!toggleBtn || !picker) return;

        EMOJI_CATEGORIES.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'emoji-cat-btn' + (cat === currentEmojiCategory ? ' active' : '');
          btn.textContent = cat === 'Frekvent' ? '🕐' : EMOJI_DATA[cat][0];
          btn.title = cat;
          btn.addEventListener('click', () => { currentEmojiCategory = cat; renderEmojiGrid(); });
          categoriesEl.appendChild(btn);
        });

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          picker.classList.toggle('open');
          if (picker.classList.contains('open')) {
            EMOJI_DATA['Frekvent'] = getFrequentEmojis();
            renderEmojiGrid();
            searchInput.focus();
          }
        });

        let _emojiSearchTimer = null;
        searchInput.addEventListener('input', () => { clearTimeout(_emojiSearchTimer); _emojiSearchTimer = setTimeout(() => renderEmojiGrid(searchInput.value.trim()), 150); });
        document.addEventListener('click', (e) => { if (!picker.contains(e.target) && e.target !== toggleBtn) picker.classList.remove('open'); });
      }

      function renderEmojiGrid(filter) {
        const gridEl = document.getElementById('emojiGrid');
        if (!gridEl) return;
        gridEl.innerHTML = '';
        let emojis = [];
        if (filter) {
          for (const cat of EMOJI_CATEGORIES) {
            emojis.push(...EMOJI_DATA[cat]);
          }
        } else {
          emojis = EMOJI_DATA[currentEmojiCategory] || [];
        }
        emojis.forEach(emoji => {
          if (filter && !emoji.includes(filter)) return;
          const btn = document.createElement('button');
          btn.className = 'emoji-grid-item';
          btn.textContent = emoji;
          btn.setAttribute('aria-label', emoji);
          btn.addEventListener('click', () => {
            addFrequentEmoji(emoji);
            if (currentReactionTarget) {
              toggleReaction(currentReactionTarget, emoji);
              currentReactionTarget = null;
            } else {
              const input = document.getElementById('messageInput');
              if (input) { input.value += emoji; input.focus(); updateSendButton(); }
            }
            document.getElementById('fullEmojiPicker')?.classList.remove('open');
          });
          gridEl.appendChild(btn);
        });
      }

      initFullEmojiPicker();

      // ── Link Previews ──
      const linkPreviewCache = {};
      const LINK_PREVIEW_CACHE_MAX = 100;
      async function fetchLinkPreview(text) {
        const urlMatch = text.match(/https?:\/\/[^\s<>"')]+/);
        if (!urlMatch) return null;
        const url = urlMatch[0];
        if (linkPreviewCache[url]) return linkPreviewCache[url];
        try {
          const data = await loadJSON('/link-preview?url=' + encodeURIComponent(url));
          if (data.preview) {
            const keys = Object.keys(linkPreviewCache);
            if (keys.length >= LINK_PREVIEW_CACHE_MAX) delete linkPreviewCache[keys[0]];
            linkPreviewCache[url] = data.preview;
            return data.preview;
          }
        } catch (e) {}
        return null;
      }

      function renderLinkPreview(preview) {
        if (!preview) return '';
        let html = '<div class="link-preview-card">';
        if (preview.image) html += '<img class="lp-image" src="' + escapeHtml(preview.image) + '" alt="" />';
        if (preview.title) html += '<div class="lp-title">' + escapeHtml(preview.title) + '</div>';
        if (preview.description) html += '<div class="lp-desc">' + escapeHtml(preview.description) + '</div>';
        try { html += '<div class="lp-url">' + escapeHtml(new URL(preview.url).hostname) + '</div>'; } catch {}
        html += '</div>';
        return html;
      }

      const origFinishAppend = finishAppend;
      function finishAppendWithLinkPreview(message, chatId, isMe, renderedText) {
        origFinishAppend(message, chatId, isMe, renderedText);
        if (!isMe && message.type === 'text' && renderedText && renderedText.match(/https?:\/\//)) {
          const lastMsg = messagesBox.lastElementChild;
          if (lastMsg && lastMsg.dataset.msgId === message.id) {
            fetchLinkPreview(renderedText).then(preview => {
              if (preview && lastMsg.isConnected) {
                const card = document.createElement('div');
                card.innerHTML = renderLinkPreview(preview);
                const msgText = lastMsg.querySelector('.msg-text');
                if (msgText && card.firstElementChild) msgText.after(card.firstElementChild);
              }
            }).catch(() => {});
          }
        }
      }
      finishAppend = finishAppendWithLinkPreview;

      // ── Pinned Messages ──
      async function loadPinnedMessages(chatId) {
        const bar = document.getElementById('pinnedBar');
        const text = document.getElementById('pinnedText');
        if (!bar || !text) return;
        try {
          const data = await loadJSON('/pins/' + encodeURIComponent(chatId));
          if (data.pins && data.pins.length > 0) {
            const pin = data.pins[0];
            text.textContent = '📌 ' + (pin.text || '').substring(0, 100);
            bar.style.display = 'flex';
            bar.onclick = () => {
              const el = document.querySelector('[data-message-id="' + CSS.escape(pin.id) + '"]');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };
          } else {
            bar.style.display = 'none';
          }
        } catch (e) { bar.style.display = 'none'; }
      }

      document.getElementById('pinnedClose')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!activeChat) return;
        try {
          const data = await loadJSON('/pins/' + encodeURIComponent(activeChat.target));
          if (data.pins && data.pins.length > 0) {
            await loadJSON('/pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_target: activeChat.target, msg_id: data.pins[0].id, pin: false }) });
            document.getElementById('pinnedBar').style.display = 'none';
          }
        } catch (e) {}
      });

      // ── Scheduled Messages ──
      function showScheduleBar() {
        const bar = document.getElementById('scheduleBar');
        if (bar) bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
      }

      document.getElementById('scheduleSendBtn')?.addEventListener('click', async () => {
        if (!activeChat) return;
        const timeInput = document.getElementById('scheduleTime');
        const sendAt = timeInput?.value;
        if (!sendAt) { toast('Velg tidspunkt'); return; }
        const input = document.getElementById('messageInput');
        const text = (input?.value || '').trim();
        if (!text) { toast('Skriv en melding'); return; }
        try {
          const body = { ciphertext: text, send_at: new Date(sendAt).toISOString() };
          if (activeChat.type === 'user') body.recipient = activeChat.target;
          else body.group_id = activeChat.target;
          await fetch('/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          toast('Melding planlagt', 'success');
          input.value = '';
          updateSendButton();
          document.getElementById('scheduleBar').style.display = 'none';
        } catch (e) { toast('Kunne ikke planlegge melding'); }
      });

      document.getElementById('scheduleCancelBtn')?.addEventListener('click', () => {
        document.getElementById('scheduleBar').style.display = 'none';
      });

      // ── Polls ──
      document.getElementById('pollBtn')?.addEventListener('click', () => {
        if (!activeChat || (activeChat.type !== 'group' && activeChat.type !== 'user')) { toast('Velg en samtale foerst'); return; }
        const question = prompt('Spørsmål:');
        if (!question) return;
        const optionsStr = prompt('Alternativer (kommadelt):');
        if (!optionsStr) return;
        const options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return toast('Minst 2 alternativer');
        createPoll(question, options);
      });

      async function createPoll(question, options) {
        try {
          const data = await loadJSON('/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question, options,
              target: activeChat.target,
              target_type: activeChat.type === 'group' ? 'group' : 'user',
            })
          });
          toast('Avstemning opprettet', 'success');
          if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke opprette avstemning');
        }
      }

      async function loadPoll(pollId) {
        try {
          const data = await loadJSON('/polls/' + encodeURIComponent(pollId));
          return data.poll || null;
        } catch (e) { return null; }
      }

      async function votePoll(pollId, indices) {
        try {
          await loadJSON('/polls/' + encodeURIComponent(pollId) + '/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ options: indices })
          });
          if (activeChat?.type === 'user') await loadChat(activeChat.target); else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke stemme');
        }
      }

      function renderPollCard(poll) {
        if (!poll) return '';
        const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
        const myVote = window.__APP__?.username;
        let html = '<div class="poll-card" data-poll-id="' + escapeHtml(poll.id) + '">'
          + '<div class="poll-question">📊 ' + escapeHtml(poll.question) + '</div>';
        poll.options.forEach((opt, idx) => {
          const pct = totalVotes > 0 ? Math.round(opt.votes.length / totalVotes * 100) : 0;
          const voted = opt.votes.includes(myVote);
          html += '<div class="poll-option' + (voted ? ' voted' : '') + '" data-idx="' + idx + '">'
            + '<div class="poll-bar" style="width:' + pct + '%"></div>'
            + '<span class="poll-label">' + escapeHtml(opt.text) + '</span>'
            + '<span class="poll-pct">' + pct + '% (' + opt.votes.length + ')</span>'
            + '</div>';
        });
        html += '<div class="poll-total" style="font-size:.72rem;color:var(--c-text-muted);margin-top:4px;">' + totalVotes + ' stemmer' + (poll.closed ? ' · Lukket' : '') + '</div>'
          + '</div>';
        return html;
      }

      // Add schedule toggle to send button area
      document.getElementById('sendBtn')?.addEventListener('contextmenu', (e) => { e.preventDefault(); showScheduleBar(); });
      initScheduleButton();
      document.getElementById('folderEditBtn')?.addEventListener('click', showFolderEditor);

      // ── Disappearing Messages Toggle ──
      function addDisappearToggle() {
        const meta = document.getElementById('chatMeta');
        if (!meta || !activeChat || activeChat.type !== 'user') return;
        const existing = meta.querySelector('.disappear-toggle');
        if (existing) existing.remove();
        const wrap = document.createElement('span');
        wrap.className = 'disappear-toggle';
        wrap.innerHTML = '💣 <select id="disappearSelect" aria-label="Forsvinnende meldinger">'
          + '<option value="">Av</option>'
          + '<option value="5">5 min</option>'
          + '<option value="30">30 min</option>'
          + '<option value="60">1 time</option>'
          + '<option value="1440">24 timer</option>'
          + '<option value="10080">7 dager</option>'
          + '</select>';
        meta.appendChild(wrap);
        document.getElementById('disappearSelect')?.addEventListener('change', (e) => {
          window._disappearMinutes = parseInt(e.target.value) || 0;
          toast(window._disappearMinutes ? 'Forsvinnende meldinger: ' + e.target.value + ' min' : 'Forsvinnende meldinger av', 'success');
        });
      }

      // ── Effect Picker ──
      document.getElementById('effectBtn')?.addEventListener('click', () => {
        const picker = document.getElementById('effectPicker');
        if (picker) picker.classList.toggle('open');
      });
      document.getElementById('effectPicker')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-effect]');
        if (!btn) return;
        window._selectedEffect = btn.dataset.effect;
        document.getElementById('effectPicker')?.classList.remove('open');
        toast('Effekt: ' + btn.title, 'success');
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#effectBtn') && !e.target.closest('#effectPicker')) {
          document.getElementById('effectPicker')?.classList.remove('open');
        }
        const replyRef = e.target.closest('.reply-ref');
        if (replyRef) {
          const msgId = replyRef.dataset.replyTo;
          if (msgId) window.scrollToMessage(msgId);
        }
        const storyItem = e.target.closest('[data-story-id]');
        if (storyItem) {
          const storyId = storyItem.dataset.storyId;
          if (storyId && window._viewStory) window._viewStory(storyId);
        }
        const createStoryBtn = e.target.closest('[data-action="create-story"]');
        if (createStoryBtn && window._createStory) window._createStory();
        if (e.target.closest('.copy-invite-btn')) {
          const input = e.target.closest('.copy-invite-btn').previousElementSibling;
          if (input) {
            navigator.clipboard.writeText(input.value).then(() => toast('Kopiert!')).catch(() => {});
          }
        }
      });

      // ── Keyboard Shortcuts ──
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modal = document.querySelector('.modal-overlay');
          if (modal) { modal.remove(); return; }
          const mediaViewer = document.querySelector('.media-viewer');
          if (mediaViewer) { mediaViewer.remove(); return; }
          document.querySelectorAll('.full-emoji-picker.open').forEach(el => el.classList.remove('open'));
          const replyBar = document.getElementById('replyBar');
          if (replyBar && replyBar.style.display !== 'none') { replyBar.style.display = 'none'; replyingTo = null; return; }
          if (activeChat) { closeChat(); return; }
        }
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
        if (e.ctrlKey && e.key === 'n') {
          e.preventDefault();
          const newChat = document.getElementById('newChatBtn');
          if (newChat) newChat.click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const sb = document.getElementById('sidebarSearch');
          if (sb) { sb.focus(); sb.select(); }
        }
        if (e.key === 'ArrowUp' && !e.target.closest('input, textarea')) {
          e.preventDefault();
          const msgs = messagesBox.querySelectorAll('.msg.sent');
          if (msgs.length) msgs[msgs.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (e.key === 'ArrowDown' && !e.target.closest('input, textarea')) {
          e.preventDefault();
          const msgs = messagesBox.querySelectorAll('.msg.received');
          if (msgs.length) msgs[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      // ── Push Notifications ──
      function initPushNotifications() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') return;
        if (Notification.permission === 'denied') return;
        const req = () => { Notification.requestPermission(); document.removeEventListener('click', req); document.removeEventListener('keydown', req); };
        document.addEventListener('click', req, { once: true });
        document.addEventListener('keydown', req, { once: true });
      }
      if ('Notification' in window) initPushNotifications();

      loadJSON('/settings/quiet').then(d => {
        const q = (d && d.quiet) || {};
        localStorage.setItem('quietHours', JSON.stringify(q.enabled ? { start: q.start, end: q.end } : null));
      }).catch(() => {});

      // ── Socket.IO callback stubs ──
      window.__onTyping = window.__onTyping || ((data) => {
        const indicator = document.getElementById('typingIndicator');
        if (!indicator) return;
        if (data.isTyping) {
          indicator.textContent = data.username + ' skriver...';
        } else {
          indicator.textContent = '';
        }
      });
      window.__onIncomingCall = window.__onIncomingCall || ((data) => {
        checkIncomingCalls();
      });

      // ── Online status ──
      window.__onPresenceUpdate = (data) => {
        if (data.status === 'online') onlineUsers.add(data.username);
        else onlineUsers.delete(data.username);
        renderUsers();
        renderGroups();
      };
      if (window.__SOCKET) {
        window.__SOCKET.on('connect', () => {
          if (window.__APP__?.username) {
            window.__SOCKET.emit('presence', { status: 'online', users: [] });
          }
        });
        window.__SOCKET.on('call_signal', (data) => {
          if (data.type === 'screen_share_start') {
            toast('Samtalepartner deler skjerm');
          } else if (data.type === 'screen_share_stop') {
            toast('Samtalepartner sluttet å dele skjerm');
          }
        });
      }

      // ── Call Recording ──
      let callRecorder = null;
      let callRecordingChunks = [];

      function addRecordingButton() {
        const actions = document.querySelector('.call-actions');
        if (!actions || document.getElementById('callRecordBtn')) return;
        const btn = document.createElement('button');
        btn.id = 'callRecordBtn';
        btn.className = 'call-record-btn';
        btn.title = 'Ta opp samtale';
        btn.setAttribute('aria-label', 'Ta opp samtale');
        btn.textContent = '⏺️';
        btn.addEventListener('click', () => {
          if (callRecorder && callRecorder.state === 'recording') {
            callRecorder.stop();
            btn.classList.remove('recording');
            btn.textContent = '⏺️';
          } else {
            startCallRecording();
            btn.classList.add('recording');
            btn.textContent = '⏹️';
          }
        });
        actions.insertBefore(btn, actions.firstChild);
      }

      function startCallRecording() {
        if (!localStream && !peerConnection) return;
        const remoteVideo = document.getElementById('remoteVideo');
        const streams = [];
        if (localStream) streams.push(localStream);
        if (remoteVideo?.srcObject) streams.push(remoteVideo.srcObject);
        if (!streams.length) return;
        try {
          const combined = new MediaStream([
            ...streams.flatMap(s => s.getAudioTracks()),
          ]);
          callRecorder = new MediaRecorder(combined, { mimeType: 'audio/webm;codecs=opus' });
          callRecordingChunks = [];
          callRecorder.ondataavailable = (e) => { if (e.data.size > 0) callRecordingChunks.push(e.data); };
          callRecorder.onstop = async () => {
            const blob = new Blob(callRecordingChunks, { type: 'audio/webm' });
            const form = new FormData();
            form.append('file', blob, 'call-recording-' + Date.now() + '.webm');
            if (activeChat?.type === 'user') form.append('recipient', activeChat.target);
            else if (activeChat?.type === 'group') form.append('groupId', activeChat.target);
            await fetch('/upload', { method: 'POST', body: form });
            toast('Opptak lagret', 'success');
          };
          callRecorder.start();
        } catch (e) { toast('Kunne ikke starte opptak'); }
      }

      const origRenderCallOverlay = renderCallOverlay;
      function renderCallOverlayWithRecord(info) {
        origRenderCallOverlay(info);
        addRecordingButton();
      }
      renderCallOverlay = renderCallOverlayWithRecord;

      // ── Key Rotation ──
      document.getElementById('rotateKeyBtn')?.addEventListener('click', async () => {
        if (!confirm('Roter.noekkel? Du maa dele den nye offentlige noekkelen med alle kontakter.')) return;
        try {
          const data = await loadJSON('/key/rotate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          toast(data.message || 'Noekkel rotert', 'success');
          await window.__CRYPTO__.getOrCreateIdentity();
        } catch (e) { toast('Kunne ikke rotere noekkel'); }
      });

      // ── Pin action in message context menu ──
      const origContextHandler = (message, item) => {
        if (item._pinHandlerAttached) return;
        item._pinHandlerAttached = true;
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (message.deleted) return;
          replyingTo = { id: message.id, sender: message.sender, text: message.text || '' };
          document.getElementById('replyBar').style.display = 'flex';
          document.getElementById('replyBarName').textContent = message.sender;
          document.getElementById('replyBarPreview').textContent = (message.text || '').substring(0, 60);
          document.getElementById('messageInput').focus();
          const pinBtn = document.createElement('button');
          pinBtn.className = 'msg-action-btn';
          pinBtn.textContent = '📌';
          pinBtn.title = 'Fest melding';
          pinBtn.setAttribute('aria-label', 'Fest melding');
          let actions = item.querySelector('.msg-actions');
          if (!actions) {
            actions = document.createElement('div');
            actions.className = 'msg-actions';
            item.appendChild(actions);
          }
          if (!actions.querySelector('.pin-msg-btn')) {
            pinBtn.classList.add('pin-msg-btn');
            pinBtn.addEventListener('click', async (ev) => {
              ev.stopPropagation();
              const chatType = activeChat?.type === 'group' ? 'group' : 'user';
              const chatId = activeChat?.target;
              try {
                await loadJSON('/pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_target: chatId, msg_id: message.id, pin: true }) });
                toast('Melding festet', 'success');
                loadPinnedMessages(chatId);
              } catch (e) { toast('Kunne ikke feste melding'); }
            });
            actions.appendChild(pinBtn);
          }
        });
      };
      // Patch finishAppend to add pin action
      const _origFinishAppend = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText, parent) {
        _origFinishAppend(message, chatId, isMe, renderedText, parent);
        const item = messagesBox.querySelector('[data-message-id="' + CSS.escape(message.id) + '"]');
        if (item && !message.deleted) origContextHandler(message, item);
      };

      async function toggleReaction(messageId, emoji) {
        try {
          await fetch('/reactions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_id: messageId, emoji })
          });
          if (activeChat?.type === 'user') await loadChat(activeChat.target);
          else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke legge til reaksjon');
        }
      }

      async function editMessage(messageId) {
        const newText = prompt('Rediger melding:');
        if (newText === null || !newText.trim()) return;
        try {
          await fetch('/messages/' + encodeURIComponent(messageId) + '/edit', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ciphertext: newText.trim() })
          });
          toast('Melding redigert', 'success');
          if (activeChat?.type === 'user') await loadChat(activeChat.target);
          else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke redigere');
        }
      }

      async function deleteMessage(messageId) {
        if (!confirm('Slett denne meldingen?')) return;
        try {
          await fetch('/messages/' + encodeURIComponent(messageId), { method: 'DELETE' });
          toast('Melding slettet', 'success');
          if (activeChat?.type === 'user') await loadChat(activeChat.target);
          else if (activeChat?.type === 'group') await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke slette');
        }
      }

      function isInQuietHours() {
        try {
          const raw = localStorage.getItem('quietHours');
          if (!raw) return false;
          const q = JSON.parse(raw);
          if (!q || !q.start || !q.end) return false;
          const now = new Date();
          const cur = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
          const s = q.start, e = q.end;
          if (s < e) return s <= cur && cur < e;
          return cur >= s || cur < e;
        } catch (e) { return false; }
      }

      function showMessageNotification(message) {
        try {
          if (stealthMode) return;
          if (message.silent) return;
          if (isInQuietHours()) return;
          playNotificationSound();
          if (Notification.permission !== 'granted') return;
          if (message.sender === (window.__APP__?.username || '')) return;
          const senderName = getDisplayName(message.sender || '');
          let body = '';
          if (message.deleted) body = '[Slettet]';
          else if (message.type === 'file' || message.type === 'file_e2ee') body = '📎 ' + (message.filename || 'Vedlegg');
          else body = message.text || '';
          new Notification(senderName, { body: body.substring(0, 120) });
        } catch (e) {}
      }

      async function loadUserProfiles() {
        try {
          const data = await loadJSON('/users/all');
          (data.users || []).forEach(u => {
            if (u && u.username) userProfiles[u.username] = u;
          });
        } catch (e) {
          try {
            const data = await loadJSON('/users');
            (data.users || []).forEach(u => {
              const name = typeof u === 'string' ? u : (u && u.username);
              if (name && !userProfiles[name]) userProfiles[name] = { username: name, display_name: name };
            });
          } catch (e2) {}
        }
        renderUsers();
      }

      function showGlobalSearch() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay global-search-modal';
        overlay.innerHTML = '<div class="modal global-search-dialog">'
          + '<div class="global-search-header"><h2>Globalt søk</h2><button class="global-search-close btn btn-small btn-ghost">✕</button></div>'
          + '<div class="global-search-input-wrap"><input id="globalSearchInput" class="input-text" placeholder="Søk i alle meldinger..." autofocus /></div>'
          + '<div id="globalSearchResults" class="global-search-results"><div class="global-search-empty">Skriv inn et søk for å finne meldinger</div></div>'
          + '</div>';
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#globalSearchInput');
        const resultsEl = overlay.querySelector('#globalSearchResults');

        input.addEventListener('input', debounce(() => {
          const q = input.value.trim();
          if (!q) { resultsEl.innerHTML = '<div class="global-search-empty">Skriv inn et søk for å finne meldinger</div>'; return; }
          resultsEl.innerHTML = '<div class="global-search-loading"><div class="spinner"></div></div>';
          (async () => {
            try {
              const data = await loadJSON('/search?q=' + encodeURIComponent(q));
              const msgs = data.messages || [];
              const groups = {};
              const me = window.__APP__?.username || '';
              msgs.forEach(m => {
                const partner = m.sender === me ? m.recipient : m.sender;
                if (!partner) return;
                if (!groups[partner]) groups[partner] = [];
                groups[partner].push(m);
              });
              const partners = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
              if (!partners.length) {
                resultsEl.innerHTML = '<div class="global-search-empty">Ingen resultater for <strong>' + escapeHtml(q) + '</strong></div>';
                return;
              }
              let html = '<div class="global-search-count">' + msgs.length + ' treff i ' + partners.length + ' samtaler</div>';
              partners.forEach(partner => {
                html += '<div class="search-group"><div class="search-group-title" data-partner="' + escapeHtml(partner) + '"><div class="avatar-wrap">' + avatarHtml(partner, 24) + '</div><span>' + escapeHtml(getDisplayName(partner)) + '</span><span class="search-group-count">' + groups[partner].length + '</span></div>';
                groups[partner].slice(0, 5).forEach(m => {
                  const preview = (m.text || '').substring(0, 100);
                  const ts = m.timestamp ? formatTime(m.timestamp) : '';
                  html += '<div class="search-result-item" data-partner="' + escapeHtml(partner) + '" data-type="user"><div class="search-result-text">' + escapeHtml(preview) + '</div><div class="search-result-meta"><span class="search-result-sender">' + escapeHtml(m.sender) + '</span><span class="search-result-time">' + escapeHtml(ts) + '</span></div></div>';
                });
                if (groups[partner].length > 5) {
                  html += '<div class="search-result-more">+' + (groups[partner].length - 5) + ' flere treff</div>';
                }
                html += '</div>';
              });
              resultsEl.innerHTML = html;
              resultsEl.querySelectorAll('.search-group-title, .search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                  const partner = el.dataset.partner;
                  const type = el.dataset.type || 'user';
                  overlay.remove();
                  if (type === 'user') {
                    const existingUser = users.find(u => (typeof u === 'string' ? u : u.username) === partner);
                    if (existingUser) { activateItem(usersList, usersList.querySelector('[data-user="' + partner + '"]')); openChat(partner); }
                    else toast('Bruker ikke funnet');
                  }
                });
              });
            } catch(e) {
              resultsEl.innerHTML = '<div class="global-search-empty">Søk feilet. Prøv igjen.</div>';
            }
          })();
        }, 300));

        overlay.querySelector('.global-search-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        setTimeout(() => input.focus(), 100);
      }

      function showProfileModal() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const me = window.__APP__?.username || '';
        const profile = userProfiles[me] || {};
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const avatarHtml = profile.avatar
          ? '<img id="profileAvatarImg" src="' + escapeHtml(profile.avatar) + '" alt="Avatar" />'
          : '<div class="avatar-placeholder" id="profileAvatarImg">' + escapeHtml((profile.display_name || me)[0]) + '</div>';
        overlay.innerHTML = '<div class="modal">'
          + '<h2>Min profil</h2>'
          + '<div class="avatar-upload">' + avatarHtml
          + '<div><label for="profileAvatarInput" class="btn btn-small btn-ghost">Velg bilde</label>'
          + '<input id="profileAvatarInput" type="file" accept="image/*" style="display:none" /></div></div>'
          + '<div><label for="profileDisplayName">Visningsnavn</label>'
          + '<input id="profileDisplayName" class="input-text" value="' + escapeHtml(profile.display_name || '') + '" placeholder="Ditt visningsnavn" maxlength="30" /></div>'
          + '<div><label for="profileBio">Bio</label>'
          + '<textarea id="profileBio" class="input-text" placeholder="Fortell litt om deg selv..." maxlength="150">' + escapeHtml(profile.bio || '') + '</textarea></div>'
          + '<div style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;"><label>Applikasjons PIN</label>'
          + '<div style="display:flex;gap:6px;margin-top:4px;"><input id="profilePin" class="input-text" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="Ny PIN" autocomplete="new-password" style="flex:1;" />'
          + '<input id="profilePinConfirm" class="input-text" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="Gjenta PIN" autocomplete="new-password" style="flex:1;" /></div>'
          + '<button id="profilePinSaveBtn" class="btn btn-ghost" style="margin-top:6px;">Lagre PIN</button></div>'
           + '<div class="setting-section">'
           + '<h3>Selvødeleggelse</h3>'
           + '<p style="font-size:.85rem;color:#6d8094;">Slett konto automatisk etter inaktivitet</p>'
           + '<select id="destructDelay" style="background:#1c2436;border:none;border-radius:8px;color:#fff;padding:6px 10px;margin-top:4px;">'
           + '<option value="0">Aldri (av)</option>'
           + '<option value="7">7 dager</option>'
           + '<option value="14">14 dager</option>'
           + '<option value="30" selected>30 dager</option>'
           + '<option value="60">60 dager</option>'
           + '<option value="90">90 dager</option>'
           + '</select>'
           + '<button id="setDestructBtn" class="btn btn-small btn-primary" style="margin-top:8px;">Lagre</button>'
           + '<div id="destructStatus" style="font-size:.8rem;color:#6d8094;margin-top:4px;"></div>'
           + '</div>'
            + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
            + '<h3>Meldingsinnstillinger</h3>'
             + '<label style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer;">'
             + '<input type="checkbox" id="sendOnEnterToggle" ' + (sendOnEnter ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--c-primary);" />'
             + 'Send med Enter</label>'
             + '</div>'
             + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
             + '<h3>Oversettelse</h3>'
             + '<p style="font-size:.85rem;color:#6d8094;">Språk for «Oversett» i meldingsmenyen</p>'
             + '<select id="translateLangSelect" class="input-text" style="margin-top:6px;width:100%;"></select>'
             + '</div>'
             + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
             + '<h3>Blokkerte brukere</h3>'
             + '<div id="blockedUsersList" style="font-size:.85rem;color:#6d8094;">Laster...</div>'
             + '</div>'
             + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
             + '<h3>Stille-timer</h3>'
             + '<p style="font-size:.85rem;color:#6d8094;">Demp varsler i et tidsrom hver dag</p>'
             + '<label style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer;">'
             + '<input type="checkbox" id="quietEnabled" style="width:18px;height:18px;accent-color:var(--c-primary);" />Aktiv</label>'
             + '<div style="display:flex;gap:8px;margin-top:6px;align-items:center;">'
             + '<input id="quietStart" type="time" class="input-text" value="22:00" style="flex:1;" />'
             + '<span style="color:#6d8094;">til</span>'
             + '<input id="quietEnd" type="time" class="input-text" value="07:00" style="flex:1;" />'
             + '</div>'
             + '<button id="saveQuietBtn" class="btn btn-small btn-primary" style="margin-top:8px;">Lagre</button>'
             + '<div id="quietStatus" style="font-size:.8rem;color:#6d8094;margin-top:4px;"></div>'
             + '</div>'
             + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
             + '<h3>📊 Dagsoppsummering</h3>'
             + '<p style="font-size:.85rem;color:#6d8094;">Få en AI-oppsummering av uleste meldinger hver dag</p>'
             + '<label style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer;">'
             + '<input type="checkbox" id="digestEnabled" style="width:18px;height:18px;accent-color:var(--c-primary);" />Aktiv</label>'
             + '<div style="display:flex;gap:8px;margin-top:6px;align-items:center;">'
             + '<input id="digestTime" type="time" class="input-text" value="09:00" style="flex:1;" />'
             + '<span style="color:#6d8094;">klokkeslett</span>'
             + '</div>'
             + '<button id="saveDigestBtn" class="btn btn-small btn-primary" style="margin-top:8px;">Lagre</button>'
             + '<div id="digestStatus" style="font-size:.8rem;color:#6d8094;margin-top:4px;"></div>'
             + '</div>'
             + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
             + '<h3>🎨 AI-tema</h3>'
             + '<p style="font-size:.85rem;color:#6d8094;">Beskriv et tema og la AI lage fargepaletten</p>'
             + '<input id="themeDesc" class="input-text" placeholder="f.eks. rolig skog, mørk cyberpunk..." maxlength="500" style="margin-top:6px;" />'
             + '<button id="generateThemeBtn" class="btn btn-small btn-primary" style="margin-top:8px;">Generer tema</button>'
             + '<div id="themeStatus" style="font-size:.8rem;color:#6d8094;margin-top:4px;"></div>'
             + '</div>'
              + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
              + '<h3>Sikkerhetskopi</h3>'
              + '<p style="font-size:.85rem;color:#6d8094;">Last ned alle samtalene dine som JSON. E2EE-meldinger merkes som krypterte.</p>'
              + '<a href="/backup" class="btn btn-small btn-ghost" style="margin-top:8px;display:inline-block;">⬇️ Last ned backup</a>'
              + '</div>'
              + '<div class="setting-section" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:6px;">'
              + '<h3>🔑 E2EE-nøkkelbackup</h3>'
              + '<p style="font-size:.85rem;color:#6d8094;">Krypter E2EE-nøklene dine med en gjenopprettingsfrase og last opp til serveren. Bruk frasen til å gjenopprette nøklene på en ny enhet.</p>'
              + '<div style="display:flex;gap:8px;margin-top:8px;">'
              + '<button id="backupKeysBtn" class="btn btn-small btn-primary">Eksporter nøkler</button>'
              + '<button id="restoreKeysBtn" class="btn btn-small btn-ghost">Gjenopprett nøkler</button>'
              + '<input id="restoreKeysFile" type="file" accept=".json" style="display:none" />'
              + '</div>'
              + '<div id="keyBackupStatus" style="font-size:.8rem;color:#6d8094;margin-top:6px;"></div>'
              + '</div>'
             + '<div class="modal-actions">'
           + '<button id="profileCancelBtn" class="btn btn-ghost">Avbryt</button>'
           + '<button id="profileSaveBtn" class="btn btn-primary">Lagre</button>'
           + '</div></div>';
         document.body.appendChild(overlay);

        let avatarBase64 = profile.avatar || '';
        const avatarInput = overlay.querySelector('#profileAvatarInput');
        const avatarImg = overlay.querySelector('#profileAvatarImg');
        avatarInput.addEventListener('change', () => {
          const file = avatarInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            avatarBase64 = e.target.result;
            if (avatarImg.tagName === 'IMG') { avatarImg.src = avatarBase64; }
            else {
              const newImg = document.createElement('img');
              newImg.id = 'profileAvatarImg';
              newImg.src = avatarBase64;
              newImg.alt = 'Avatar';
              avatarImg.replaceWith(newImg);
            }
          };
          reader.readAsDataURL(file);
        });

        overlay.querySelector('#profileSaveBtn').addEventListener('click', async () => {
          const displayName = overlay.querySelector('#profileDisplayName').value.trim();
          const bio = overlay.querySelector('#profileBio').value.trim();
          try {
            await fetch('/profile', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ display_name: displayName, bio: bio, avatar: avatarBase64 })
            });
            toast('Profil lagret', 'success');
            overlay.remove();
            await loadUserProfiles();
            if (activeChat) {
              if (activeChat.type === 'user') chatTitle.textContent = getDisplayName(activeChat.target);
              else {
                const g = groups.find(g => g.id === activeChat.target);
                if (g) chatTitle.textContent = g.name;
              }
            }
          } catch (e) {
            toast('Kunne ikke lagre profil');
          }
        });

        const pinSaveBtn = overlay.querySelector('#profilePinSaveBtn');
        if (pinSaveBtn) {
          pinSaveBtn.addEventListener('click', async () => {
            const pin = overlay.querySelector('#profilePin').value.trim();
            const confirm = overlay.querySelector('#profilePinConfirm').value.trim();
            if (!pin || pin.length < 4) return toast('PIN må være minst 4 siffer');
            if (pin !== confirm) return toast('PIN matcher ikke');
            try {
              const res = await fetch('/profile/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
              });
              const data = await safeJson(res);
              if (data && data.success) {
                toast('PIN lagret', 'success');
                overlay.querySelector('#profilePin').value = '';
                overlay.querySelector('#profilePinConfirm').value = '';
              } else {
                toast(data && data.message ? data.message : 'Kunne ikke lagre PIN');
              }
            } catch (e) {
              toast('Kunne ikke lagre PIN');
            }
          });
        }

        document.getElementById('setDestructBtn')?.addEventListener('click', async () => {
          const delay = parseInt(document.getElementById('destructDelay').value);
          try {
            const d = await loadJSON('/account/self-destruct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delay }) });
            toast(d.message || 'Selvødeleggelse oppdatert', 'success');
            document.getElementById('destructStatus').textContent = delay > 0 ? 'Konto slettes om ' + delay + ' dager' : '';
          } catch(e) { toast('Kunne ikke oppdatere'); }
        });

        const backupKeysBtn = overlay.querySelector('#backupKeysBtn');
        const restoreKeysBtn = overlay.querySelector('#restoreKeysBtn');
        const restoreKeysFile = overlay.querySelector('#restoreKeysFile');
        const keyBackupStatus = overlay.querySelector('#keyBackupStatus');
        const setKeyBackupStatus = (msg) => { if (keyBackupStatus) keyBackupStatus.textContent = msg; };
        if (backupKeysBtn) backupKeysBtn.addEventListener('click', async () => {
          if (!window.__CRYPTO__ || !window.__CRYPTO__.exportBackup) return setKeyBackupStatus('Kryptering ikke tilgjengelig');
          const phrase = prompt('Lag en gjenopprettingsfrase (minst 10 tegn). Denne krypterer nøklene dine og kan aldri hentes igjen.');
          if (!phrase) return;
          if (phrase.length < 10) return setKeyBackupStatus('Frasen må være minst 10 tegn');
          const confirmPhrase = prompt('Gjenta frasen for bekreftelse:');
          if (confirmPhrase !== phrase) return setKeyBackupStatus('Frasene matchet ikke');
          try {
            setKeyBackupStatus('Krypterer nøkler...');
            const blob = JSON.stringify(await window.__CRYPTO__.exportBackup(phrase));
            const res = await fetch('/account/backup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blob })
            });
            const data = await res.json();
            if (!data.success) return setKeyBackupStatus(data.message || 'Kunne ikke lagre backup');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
            a.download = 'cryptochat-e2ee-backup-' + (window.__APP__.username || 'user') + '.json';
            a.click();
            setKeyBackupStatus('Eksportert og lastet opp til server. Oppbevar frasen trygt!');
            toast('E2EE-nøkler sikkerhetskopiert', 'success');
          } catch (e) { setKeyBackupStatus('Eksport feilet: ' + e.message); }
        });
        if (restoreKeysBtn) restoreKeysBtn.addEventListener('click', () => restoreKeysFile && restoreKeysFile.click());
        if (restoreKeysFile) restoreKeysFile.addEventListener('change', async () => {
          const file = restoreKeysFile.files[0];
          if (!file) return;
          if (!window.__CRYPTO__ || !window.__CRYPTO__.importBackup) return setKeyBackupStatus('Dekryptering ikke tilgjengelig');
          try {
            const parsed = JSON.parse(await file.text());
            const phrase = prompt('Skriv inn gjenopprettingsfrasen din:');
            if (!phrase) return;
            setKeyBackupStatus('Dekrypterer nøkler...');
            await window.__CRYPTO__.importBackup(parsed, phrase);
            setKeyBackupStatus('Nøkler gjenopprettet. Siden lastes på nytt.');
            toast('E2EE-nøkler gjenopprettet', 'success');
            setTimeout(() => location.reload(), 1500);
          } catch (e) { setKeyBackupStatus('Gjenoppretting feilet: ' + ((e && e.message) || 'Feil frase eller fil')); }
        });

        overlay.querySelector('#sendOnEnterToggle')?.addEventListener('change', function() {
          sendOnEnter = this.checked;
          localStorage.setItem('sendOnEnter', sendOnEnter);
        });

        (async () => {
          const translateSelect = overlay.querySelector('#translateLangSelect');
          if (translateSelect) {
            try {
              const d = await loadJSON('/translate/languages');
              const current = localStorage.getItem('translateLang') || 'en';
              translateSelect.innerHTML = (d.languages || []).map(l =>
                '<option value="' + escapeHtml(l.code) + '"' + (l.code === current ? ' selected' : '') + '>' + escapeHtml(l.name) + '</option>'
              ).join('');
              translateSelect.addEventListener('change', () => {
                localStorage.setItem('translateLang', translateSelect.value);
                toast('Oversettelsesspråk: ' + translateSelect.options[translateSelect.selectedIndex].text, 'success');
              });
            } catch (e) {}
          }
        })();

        (async () => {
          const quietEnabled = overlay.querySelector('#quietEnabled');
          const quietStart = overlay.querySelector('#quietStart');
          const quietEnd = overlay.querySelector('#quietEnd');
          const saveQuietBtn = overlay.querySelector('#saveQuietBtn');
          const quietStatus = overlay.querySelector('#quietStatus');
          if (quietEnabled) {
            try {
              const d = await loadJSON('/settings/quiet');
              const q = d.quiet || {};
              quietEnabled.checked = !!q.enabled;
              if (q.start) quietStart.value = q.start;
              if (q.end) quietEnd.value = q.end;
              if (q.enabled) quietStatus.textContent = 'Stille-timer aktiv: ' + q.start + '–' + q.end;
            } catch (e) {}
            saveQuietBtn.addEventListener('click', async () => {
              const enabled = quietEnabled.checked;
              try {
                await loadJSON('/settings/quiet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, start: quietStart.value, end: quietEnd.value }) });
                localStorage.setItem('quietHours', JSON.stringify(enabled ? { start: quietStart.value, end: quietEnd.value } : null));
                quietStatus.textContent = enabled ? 'Stille-timer aktiv: ' + quietStart.value + '–' + quietEnd.value : 'Stille-timer av';
                toast('Stille-timer lagret', 'success');
              } catch (e) { toast('Kunne ikke lagre stille-timer'); }
            });
          }
        })();

        (async () => {
          const digestEnabled = overlay.querySelector('#digestEnabled');
          const digestTime = overlay.querySelector('#digestTime');
          const saveDigestBtn = overlay.querySelector('#saveDigestBtn');
          const digestStatus = overlay.querySelector('#digestStatus');
          if (digestEnabled) {
            try {
              const d = await loadJSON('/settings/digest');
              digestEnabled.checked = !!d.enabled;
              if (d.time) digestTime.value = d.time;
              if (d.enabled) digestStatus.textContent = 'Dagsoppsummering: ' + d.time + ' (server-tid)';
            } catch (e) {}
            saveDigestBtn.addEventListener('click', async () => {
              const enabled = digestEnabled.checked;
              const localVal = digestTime.value;
              const [hh, mm] = localVal.split(':').map(Number);
              const conv = new Date();
              conv.setHours(hh, mm, 0, 0);
              const utcVal = String(conv.getUTCHours()).padStart(2, '0') + ':' + String(conv.getUTCMinutes()).padStart(2, '0');
              try {
                await loadJSON('/settings/digest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled, time: utcVal }) });
                digestStatus.textContent = enabled ? 'Dagsoppsummering: ' + localVal + ' (lokal tid)' : 'Dagsoppsummering av';
                toast('Dagsoppsummering lagret', 'success');
              } catch (e) { toast('Kunne ikke lagre dagsoppsummering'); }
            });
          }
        })();

        (async () => {
          const themeDesc = overlay.querySelector('#themeDesc');
          const generateThemeBtn = overlay.querySelector('#generateThemeBtn');
          const themeStatus = overlay.querySelector('#themeStatus');
          if (generateThemeBtn) {
            generateThemeBtn.addEventListener('click', async () => {
              const description = themeDesc.value.trim();
              if (!description) { toast('Beskriv et tema først'); return; }
              generateThemeBtn.disabled = true;
              themeStatus.textContent = 'Genererer med AI... (kan ta ~1 minutt)';
              try {
                const r = await loadJSON('/ai/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
                if (!r.success) { themeStatus.textContent = r.message || 'Kunne ikke generere tema'; return; }
                const t = r.theme || {};
                let css = ':root {\n';
                const map = [
                  ['--c-bg', ['--c-bg', '--c-chat-bg']],
                  ['--c-card', ['--c-card', '--c-surface-2', '--c-badge-bg', '--c-badge-border']],
                  ['--c-surface', ['--c-surface']],
                  ['--c-text', ['--c-text', '--c-text-chat', '--c-sent-text']],
                  ['--c-text-muted', ['--c-text-muted', '--c-text-meta', '--c-text-preview', '--c-badge-text']],
                  ['--c-border', ['--c-border', '--c-border-item']],
                  ['--c-primary', ['--c-brand', '--c-accent', '--c-accent2', '--c-accent5', '--c-primary']],
                  ['--c-sender', ['--c-sender']],
                  ['--c-sent-bg', ['--c-sent-bg', '--c-sent-border']],
                  ['--c-received-bg', ['--c-received-bg', '--c-received-border']],
                ];
                for (const [src, targets] of map) {
                  if (!t[src]) continue;
                  for (const target of targets) css += '  ' + target + ': ' + t[src] + ';\n';
                }
                css += '}';
                localStorage.setItem('customThemeCSS', css);
                themeStatus.textContent = 'Tema lagret! Last inn siden for å se det.';
                toast('Tema generert ✓', 'success');
              } catch (e) { themeStatus.textContent = 'Kunne ikke generere tema'; }
              finally { generateThemeBtn.disabled = false; }
            });
          }
        })();

        (async () => {
          const blockedListEl = overlay.querySelector('#blockedUsersList');
          if (blockedListEl) {
            try {
              const data = await loadJSON('/blocked');
              const blocked = data.blocked || [];
              if (!blocked.length) {
                blockedListEl.innerHTML = '<span style="color:#6d8094;">Ingen blokkerte brukere</span>';
              } else {
                blockedListEl.innerHTML = blocked.map(u => '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;"><span>' + escapeHtml(u) + '</span><button class="btn btn-small btn-ghost unblock-profile-btn" data-username="' + escapeHtml(u) + '" style="color:#ff6666;font-size:.75rem;">Lås opp</button></div>').join('');
                blockedListEl.querySelectorAll('.unblock-profile-btn').forEach(btn => {
                  btn.addEventListener('click', async () => {
                    const username = btn.dataset.username;
                    try {
                      await loadJSON('/block/' + username, { method: 'DELETE' });
                      blockedUsers = blockedUsers.filter(u => u !== username);
                      btn.closest('div').remove();
                      toast('Bruker låst opp', 'success');
                      renderUsers();
                      const remaining = blockedListEl.querySelectorAll('.unblock-profile-btn').length;
                      if (!remaining) blockedListEl.innerHTML = '<span style="color:#6d8094;">Ingen blokkerte brukere</span>';
                    } catch(e) { toast('Kunne ikke låse opp'); }
                  });
                });
              }
            } catch(e) { blockedListEl.innerHTML = '<span style="color:#ff6666;">Kunne ikke laste blokkerte brukere</span>'; }
          }
        })();

        overlay.querySelector('#profileCancelBtn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      }

      document.getElementById('profileBtn').addEventListener('click', showProfileModal);

      function applyTheme(themeName) {
        const preset = THEME_PRESETS[themeName];
        if (!preset) return;
        document.body.classList.remove('theme-light');
        const propsToClear = [];
        for (let i = 0; i < document.body.style.length; i++) {
          const prop = document.body.style[i];
          if (prop.startsWith('--c-')) propsToClear.push(prop);
        }
        propsToClear.forEach(prop => document.body.style.removeProperty(prop));
        Object.entries(preset.vars).forEach(([prop, value]) => {
          document.body.style.setProperty(prop, value);
        });
        if (themeName === 'light') {
          document.body.classList.add('theme-light');
        }
        currentTheme = themeName;
        localStorage.setItem('chat-theme', themeName);
        fetch('/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: themeName }) }).catch(() => {});
        document.querySelectorAll('.theme-preset').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
      }

      function populateThemePicker() {
        const picker = document.getElementById('themePicker');
        if (!picker) return;
        picker.innerHTML = '';
        Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
          const btn = document.createElement('button');
          btn.className = 'theme-preset' + (key === currentTheme ? ' active' : '');
          btn.dataset.theme = key;
          btn.innerHTML = '<span class="theme-color-dot" style="background:' + preset.dot + '"></span>' + preset.name;
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyTheme(key);
            picker.classList.remove('open');
          });
          picker.appendChild(btn);
        });
      }

      document.getElementById('themeBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const picker = document.getElementById('themePicker');
        picker.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        const picker = document.getElementById('themePicker');
        if (picker) picker.classList.remove('open');
      });

      document.addEventListener('click', (e) => {
        const pdf = e.target.closest('.pdf-preview[data-pdf-url]');
        if (pdf) window.open(pdf.dataset.pdfUrl, '_blank');
      });

      populateThemePicker();
      applyTheme(currentTheme);

      document.getElementById('createGroupBtn').addEventListener('click', async () => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal" style="max-width:400px"><h2>Opprett gruppe</h2>'
          + '<div class="field"><label>Gruppenavn</label><input id="groupNameInput" class="input-text" placeholder="Navn" maxlength="50" /></div>'
          + '<div class="field"><label>Beskrivelse (valgfri)</label><input id="groupDesc" class="input-text" placeholder="Gruppebeskrivelse" maxlength="200" /></div>'
          + '<div class="field"><label>Medlemmer</label><input id="groupMembersInput" class="input-text" placeholder="Brukernavn (komma-separert)" /></div>'
          + '<div class="modal-actions"><button id="createGroupSubmit" class="btn btn-primary">Opprett</button>'
          + '<button id="createGroupCancel" class="btn btn-ghost">Avbryt</button></div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#createGroupCancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#createGroupSubmit').addEventListener('click', async () => {
          const name = document.getElementById('groupNameInput').value.trim();
          if (!name) { toast('Gruppenavn er påkrevd'); return; }
          const description = document.getElementById('groupDesc').value.trim();
          const members = document.getElementById('groupMembersInput').value.split(',').map(x => x.trim()).filter(Boolean);
          overlay.remove();
          try {
            const res = await fetch('/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, members }) });
            const resData = await res.json();
            if (resData.success && resData.group) {
              try {
                const groupKeyBytes = window.crypto.getRandomValues(new Uint8Array(32));
                const allMembers = [window.__APP__?.username, ...members];
                const encryptedKeys = {};
                for (const member of allMembers) {
                  const pubKey = await getPeerPublicKeyPem(member);
                  if (pubKey) {
                    const key = await window.__CRYPTO__.getSharedKey(pubKey);
                    const rawKey = await window.crypto.subtle.exportKey('raw', key);
                    const iv = window.crypto.getRandomValues(new Uint8Array(12));
                    const enc = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, groupKeyBytes);
                    encryptedKeys[member] = arrayBufferToBase64(iv) + '.' + arrayBufferToBase64(enc);
                  }
                }
                if (Object.keys(encryptedKeys).length > 0) {
                  await fetch('/groups/' + encodeURIComponent(resData.group.id) + '/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: encryptedKeys }) });
                }
              } catch (e2) { console.debug('Group E2EE key distribution failed', e2); }
            }
            toast('Gruppe opprettet', 'success');
            const data = await loadJSON('/groups');
            groups.length = 0;
            groups.push(...(data.groups || []));
            renderGroups();
          } catch (e) {
            toast('Kunne ikke opprette gruppe');
          }
        });
      });

      document.getElementById('fa2Btn').addEventListener('click', async () => {
        try {
          const data = await loadJSON('/auth/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
          const overlay = document.createElement('div');
          overlay.className = 'modal-overlay';
          overlay.innerHTML = '<div class="modal" style="max-width:400px"><h2>2FA Aktivering</h2>'
            + '<div style="text-align:center;padding:16px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.uri) + '" alt="2FA QR" style="border-radius:8px;" /></div>'
            + '<div style="text-align:center;padding:8px;background:var(--c-surface-2);border-radius:8px;font-family:monospace;font-size:.9rem;word-break:break-all;">' + escapeHtml(data.secret || '') + '</div>'
            + '<div class="modal-actions"><button class="btn btn-ghost" id="fa2CloseBtn">Lukk</button></div></div>';
          document.body.appendChild(overlay);
          overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
          overlay.querySelector('#fa2CloseBtn').addEventListener('click', () => overlay.remove());
        } catch (e) {
          toast('2FA feilet');
        }
      });

      document.getElementById('sessionsBtn').addEventListener('click', async () => {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = '<div class="modal" style="max-width:480px"><h2>Enheter & Nøkler</h2>'
          + '<div id="sessionsList" style="max-height:300px;overflow:auto;">Laster...</div>'
          + '<hr style="border-color:var(--c-border);margin:12px 0;">'
          + '<div id="syncedKeysList" style="max-height:200px;overflow:auto;">Laster nøkler...</div>'
          + '<div class="modal-actions"><button id="syncKeyBtn" class="btn btn-primary btn-small">Synkroniser nøkkel</button>'
          + '<button id="sessionsCloseBtn" class="btn btn-ghost">Lukk</button></div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#sessionsCloseBtn').addEventListener('click', () => overlay.remove());

        overlay.querySelector('#syncKeyBtn').addEventListener('click', async () => {
          try {
            const pubKey = localStorage.getItem('identityKeyPair') ? JSON.parse(localStorage.getItem('identityKeyPair')).publicKey : '';
            if (!pubKey) { toast('Ingen nøkkel å synkronisere'); return; }
            const deviceId = navigator.userAgent.slice(0, 40);
            await loadJSON('/sync/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicKey: pubKey, deviceId }) });
            toast('Nøkkel synkronisert', 'success');
            loadSyncedKeys();
          } catch (e) { toast('Synkronisering feilet'); }
        });

        async function loadSessions() {
          try {
            const data = await loadJSON('/sessions');
            const list = overlay.querySelector('#sessionsList');
            if (!data.sessions || !data.sessions.length) {
              list.innerHTML = '<p style="color:var(--c-text-muted)">Ingen aktive økter</p>';
              return;
            }
            list.innerHTML = '<h3 style="font-size:.85rem;color:var(--c-text-muted);margin-bottom:6px;">Økter</h3>' + data.sessions.map(s => '<div class="session-item">'
              + '<div class="session-info"><div class="session-device">' + escapeHtml(s.device || 'Unknown')
              + (s.current ? ' <span class="session-current">(denne)</span>' : '')
              + '</div><div class="session-time">' + escapeHtml(formatTime(s.created)) + (s.ip ? ' · ' + escapeHtml(s.ip) : '') + '</div></div>'
              + (s.current ? '' : '<button class="session-revoke" data-id="' + escapeHtml(s.id) + '">Avbryt</button>')
              + '</div>').join('');
            list.querySelectorAll('.session-revoke').forEach(btn => {
              btn.addEventListener('click', async () => {
                try {
                  await loadJSON('/sessions/' + encodeURIComponent(btn.dataset.id) + '/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                  toast('Økt avbrutt', 'success');
                  loadSessions();
                } catch (e) {
                  toast('Kunne ikke avbryte økt');
                }
              });
            });
          } catch (e) {
            overlay.querySelector('#sessionsList').innerHTML = '<p style="color:var(--c-text-muted)">Kunne ikke laste økter</p>';
          }
        }

        async function loadSyncedKeys() {
          try {
            const data = await loadJSON('/sync/keys');
            const list = overlay.querySelector('#syncedKeysList');
            const keys = data.syncedKeys || {};
            const entries = Object.entries(keys);
            if (!entries.length) {
              list.innerHTML = '<h3 style="font-size:.85rem;color:var(--c-text-muted);margin-bottom:6px;">Synkroniserte nøkler</h3><p style="color:var(--c-text-muted);font-size:.8rem;">Ingen nøkler synkronisert ennå.</p>';
              return;
            }
            list.innerHTML = '<h3 style="font-size:.85rem;color:var(--c-text-muted);margin-bottom:6px;">Synkroniserte nøkler (' + entries.length + ')</h3>'
              + entries.map(([id, k]) => '<div class="session-item"><div class="session-info"><div class="session-device">' + escapeHtml(id.slice(0, 40))
              + '</div><div class="session-time">' + escapeHtml(formatTime(k.updated)) + '</div></div>'
              + '<button class="session-revoke sync-delete-btn" data-id="' + escapeHtml(id) + '" style="font-size:.72rem;">Fjern</button></div>').join('');
            list.querySelectorAll('.sync-delete-btn').forEach(btn => {
              btn.addEventListener('click', async () => {
                try {
                  await loadJSON('/sync/keys/' + encodeURIComponent(btn.dataset.id), { method: 'DELETE' });
                  toast('Nøkkel fjernet', 'success');
                  loadSyncedKeys();
                } catch (e) { toast('Kunne ikke fjerne nøkkel'); }
              });
            });
          } catch (e) {
            overlay.querySelector('#syncedKeysList').innerHTML = '';
          }
        }

        loadSessions();
        loadSyncedKeys();
      });

      document.getElementById('myKeyBtn').addEventListener('click', async () => {
        try {
          const data = await loadJSON('/me/key');
          const pub = data.publicKey || '';
          const imported = data.importedKey || '';
          const text = pub
            ? 'Offentlig noekkel:\n' + pub + (imported ? '\n\nImportert noekkel:\n' + imported : '')
            : 'Ingen noekkel funnet. Opprettes automatisk ved foerste sending.';
          alert(text);
        } catch (e) {
          toast('Kunne ikke hente noekkel');
        }
      });

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('Logge ut?')) return;
        await fetch('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
        window.location.href = '/login';
      });

      document.getElementById('audioCallBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'user') { toast('Velg en kontakt først'); return; }
        await startCall(activeChat.target, 'audio');
      });
      document.getElementById('videoCallBtn').addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'user') { toast('Velg en kontakt først'); return; }
        await startCall(activeChat.target, 'video');
      });

      try {
        const statsData = await loadJSON('/admin/stats');
        if (statsData.success) document.getElementById('adminBtn').style.display = '';
      } catch {}
      document.getElementById('adminBtn').addEventListener('click', () => { window.open('/admin/pages', '_blank'); });

      const _pollFast = setInterval(() => {
        if (activeChat?.type === 'user') loadChat(activeChat.target);
        if (activeChat?.type === 'group') loadGroup(activeChat.target);
        checkTypingIndicator().catch(() => {});
      }, 2500);
      const _pollMedium = setInterval(() => {
        loadUnreadCounts().catch(() => {});
        updatePresence().catch(() => {});
        checkIncomingCalls().catch(() => {});
      }, 5000);
      const _pollSlow = setInterval(() => {
        loadJSON('/users/all').then(data => {
          (data.users || []).forEach(u => { if (u && u.username) userProfiles[u.username] = u; });
          users.length = 0;
          users.push(...(data.users || []));
          renderUsers();
        }).catch(() => {});
      }, 30000);

      let _slowWarmup = true;
      setTimeout(() => { _slowWarmup = false; }, 60000);

      const _pollSlowVerification = setInterval(() => {
        if (_slowWarmup) return;
        const usernames = users.map(u => typeof u === 'string' ? u : (u && u.username) || '').filter(Boolean);
        if (usernames.length) fetchBatchVerification(usernames).then(() => renderUsers()).catch(() => {});
        if (activeChat?.type === 'user') fetchVerificationStatus(activeChat.target).then(() => updateVerifyButton()).catch(() => {});
      }, 60000);

      const _pollGroups = setInterval(() => {
        loadJSON('/groups').then(data => { groups.length = 0; groups.push(...(data.groups || [])); renderGroups(); }).catch(() => {});
        loadJSON('/last-messages').then(data => {
          if (data.users) Object.assign(lastMessages, data.users);
          if (data.groups) Object.assign(groupLastMessages, data.groups);
          renderUsers();
          renderGroups();
        }).catch(() => {});
      }, 45000);

      window.addEventListener('beforeunload', () => { if (currentCall) hangUp(); });

      function updatePresence() {
        return loadJSON('/presence/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: Array.isArray(users) ? users.map(u => typeof u === 'string' ? u : (u && u.username) || '') : [] })
        }).then(data => {
          if (!data.presence) return;
          data.presence.forEach(entry => {
            if (!entry.online && entry.lastSeen) window.__lastSeenTimes[entry.username] = entry.lastSeen;
            const items = usersList.querySelectorAll('.item');
            items.forEach(item => {
              if (item.dataset.user === entry.username) {
                if (entry.online) item.classList.remove('offline'); else item.classList.add('offline');
              }
            });
          });
        });
      }

      function loadUnreadCounts() {
        return loadJSON('/unread').then(data => {
          const prev = { ...unreadCounts };
          unreadCounts = data.counts || {};
          if (activeChat?.type === 'user' && unreadCounts[activeChat.target]) {
            delete unreadCounts[activeChat.target];
          }
          const changed = JSON.stringify(prev) !== JSON.stringify(unreadCounts);
          if (changed) renderUsers();
          for (const [user, count] of Object.entries(unreadCounts)) {
            if (count > (prev[user] || 0) && user !== (window.__APP__?.username || '')) {
              playNotificationSound();
              if (Notification.permission === 'granted') {
                new Notification('CryptoChat', { body: count + ' nye meldinger fra ' + user, icon: '/static/img/icon-192.png' });
              }
            }
          }
        }).catch(() => {});
      }

      function playNotificationSound() {
        if (!_notificationAudio) {
          _notificationAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVggoKOaTczXn+DkGw2NF5/go5sNjRe' + 'f4OQbTY0X3+CkG02NF9/gpBtNjRff4KQbTY0X3+CkG02NF9/gpBtNjRff4KQbTY0');
        }
        try { _notificationAudio.currentTime = 0; _notificationAudio.play().catch(() => {}); } catch(e) {}
      }

      document.body.classList.toggle('theme-light', (window.__APP__?.theme || 'dark') === 'light');
      await loadUserProfiles();

      // ── Sticker/GIF Picker ──
      let stickerMode = 'stickers';
      const stickerPicker = document.getElementById('stickerPicker');
      const stickerTabs = document.getElementById('stickerTabs');
      const stickerContent = document.getElementById('stickerContent');
      const stickerBtn = document.getElementById('stickerBtn');

      async function initStickerPicker() {
        try {
          const data = await loadJSON('/stickers');
          stickerTabs.innerHTML = '';
          const stickersTab = document.createElement('button');
          stickersTab.className = 'sticker-tab active';
          stickersTab.textContent = '📦';
          stickersTab.title = 'Stickers';
          stickersTab.addEventListener('click', () => { stickerMode = 'stickers'; renderStickerContent(); updateStickerTabs(); });
          stickerTabs.appendChild(stickersTab);
          const gifsTab = document.createElement('button');
          gifsTab.className = 'sticker-tab';
          gifsTab.textContent = 'GIF';
          gifsTab.title = 'GIFs';
          gifsTab.addEventListener('click', () => { stickerMode = 'gifs'; renderStickerContent(); updateStickerTabs(); });
          stickerTabs.appendChild(gifsTab);
          (data.packs || []).forEach(pack => {
            const btn = document.createElement('button');
            btn.className = 'sticker-tab';
            btn.textContent = pack.name;
            btn.dataset.packId = pack.id;
            btn.addEventListener('click', () => { stickerMode = 'pack:' + pack.id; renderStickerContent(); updateStickerTabs(); });
            stickerTabs.appendChild(btn);
          });
          renderStickerContent();
        } catch (e) {}
      }

      function updateStickerTabs() {
        stickerTabs.querySelectorAll('.sticker-tab').forEach(tab => {
          tab.classList.remove('active');
          if (stickerMode === 'stickers' && tab.textContent === '📦') tab.classList.add('active');
          else if (stickerMode === 'gifs' && tab.textContent === 'GIF') tab.classList.add('active');
          else if (stickerMode === 'pack:' + tab.dataset.packId) tab.classList.add('active');
        });
      }

      async function renderStickerContent(query) {
        stickerContent.innerHTML = '';
        stickerContent.className = stickerMode === 'gifs' ? 'gif-grid' : 'sticker-grid';
        if (stickerMode === 'gifs') {
          if (query) {
            try {
              const data = await loadJSON('/gifs/search?q=' + encodeURIComponent(query));
              (data.gifs || []).forEach(gif => {
                const item = document.createElement('div');
                item.className = 'gif-item';
                item.innerHTML = '<img src="' + escapeHtml(gif.preview) + '" alt="" loading="lazy" />';
                item.addEventListener('click', () => { sendStickerOrGif(gif.url, 'gif'); stickerPicker.classList.remove('open'); });
                stickerContent.appendChild(item);
              });
            } catch (e) {}
          } else {
            stickerContent.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#7c7e9a;padding:20px;">Søk etter GIFs...</div>';
          }
        } else if (stickerMode.startsWith('pack:')) {
          const packId = stickerMode.slice(5);
          try {
            const data = await loadJSON('/stickers/' + encodeURIComponent(packId));
            (data.pack?.stickers || []).forEach(sticker => {
              const item = document.createElement('div');
              item.className = 'sticker-item';
              item.innerHTML = '<img src="' + escapeHtml(sticker.url) + '" alt="' + escapeHtml(sticker.emoji) + '" />';
              item.addEventListener('click', () => { sendStickerOrGif(sticker.url, 'sticker'); stickerPicker.classList.remove('open'); });
              stickerContent.appendChild(item);
            });
          } catch (e) {}
        } else {
          try {
            const data = await loadJSON('/stickers');
            for (const pack of (data.packs || [])) {
              try {
                const packData = await loadJSON('/stickers/' + encodeURIComponent(pack.id));
                const sticker = packData.stickers?.[0];
                if (sticker) {
                  const item = document.createElement('div');
                  item.className = 'sticker-item';
                  item.innerHTML = '<img src="' + escapeHtml(sticker.url) + '" alt="" />';
                  item.title = pack.name;
                  item.addEventListener('click', () => { stickerMode = 'pack:' + pack.id; renderStickerContent(); updateStickerTabs(); });
                  stickerContent.appendChild(item);
                }
              } catch (e2) {}
            }
          } catch (e) {}
        }
      }

      async function sendStickerOrGif(url, type) {
        if (!activeChat) return;
        try {
          if (activeChat.type === 'user') {
            const key = activeChat.peerPublicKey;
            const encUrl = key ? await encryptForPeer(url, key) : url;
            await fetch('/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: activeChat.target, ciphertext: encUrl, type: 'text' }) });
            await loadChat(activeChat.target);
          } else if (activeChat.type === 'group') {
            await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: url, type: 'text' }) });
            await loadGroup(activeChat.target);
          }
        } catch (e) { toast('Kunne ikke sende'); }
      }

      if (stickerBtn) {
        stickerBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          stickerPicker.classList.toggle('open');
          if (stickerPicker.classList.contains('open')) {
            await initStickerPicker();
          }
        });
      }

      document.addEventListener('click', (e) => {
        if (stickerPicker && !stickerPicker.contains(e.target) && e.target !== stickerBtn) stickerPicker.classList.remove('open');
      });

      // ── Video Message Recording ──
      let videoRecorder = null;
      let videoChunks = [];
      let isRecordingVideo = false;
      const videoBtn = document.getElementById('videoRecordBtn');
      if (videoBtn) {
        videoBtn.addEventListener('click', async () => {
          if (isRecordingVideo) { stopVideoRecording(); return; }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 360, height: 360, facingMode: 'user' }, audio: true });
            videoChunks = [];
            videoRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
            videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunks.push(e.data); };
            videoRecorder.onstop = async () => {
              stream.getTracks().forEach(t => t.stop());
              const blob = new Blob(videoChunks, { type: 'video/webm' });
              await sendVideoMessage(blob);
            };
            videoRecorder.start();
            isRecordingVideo = true;
            videoBtn.textContent = '⏹️';
            videoBtn.classList.add('recording');
          } catch (e) { toast('Kunne ikke starte videoopptak: ' + e.message); }
        });
      }

      function stopVideoRecording() {
        if (videoRecorder && videoRecorder.state !== 'inactive') videoRecorder.stop();
        isRecordingVideo = false;
        const btn = document.getElementById('videoRecordBtn');
        if (btn) { btn.textContent = '📹'; btn.classList.remove('recording'); }
      }

      async function sendVideoMessage(blob) {
        if (!activeChat || blob.size < 1000) return;
        const form = new FormData();
        const filename = 'video-' + Date.now() + '.webm';
        form.append('file', blob, filename);
        if (activeChat.type === 'user') form.append('recipient', activeChat.target);
        else form.append('groupId', activeChat.target);
        try {
          if (activeChat.type === 'group') {
            await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciphertext: filename, type: 'file', filename }) });
            await loadGroup(activeChat.target);
          } else {
            await fetch('/upload', { method: 'POST', body: form });
            await loadChat(activeChat.target);
          }
          toast('Videomelding sendt', 'success');
        } catch (e) { toast('Kunne ikke sende videomelding'); }
      }

      // ── Location Sharing ──
      document.getElementById('locationBtn')?.addEventListener('click', () => {
        if (!activeChat || activeChat.type === 'saved') { toast('Velg en samtale'); return; }
        if (!navigator.geolocation) { toast('Nettleseren støtter ikke posisjon'); return; }
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const label = prompt('Etikett (valgfritt):') || '';
          try {
            if (activeChat.type === 'user') {
              await fetch('/send/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: activeChat.target, lat, lng, label }) });
              await loadChat(activeChat.target);
            } else {
              await fetch('/send/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_id: activeChat.target, lat, lng, label }) });
              await loadGroup(activeChat.target);
            }
            toast('Posisjon delt', 'success');
          } catch (e) { toast('Kunne ikke dele posisjon'); }
        }, (err) => { toast('Kunne ikke hente posisjon: ' + err.message); }, { enableHighAccuracy: true, timeout: 10000 });
      });

      // ── Silent Messages Toggle ──
      let silentMode = false;
      const silentToggle = document.getElementById('silentToggle');
      if (silentToggle) {
        silentToggle.addEventListener('click', () => {
          silentMode = !silentMode;
          silentToggle.classList.toggle('active', silentMode);
          silentToggle.textContent = silentMode ? '🔔' : '🔇';
        });
      }

      // ── Draft Messages ──
      let draftSaveTimeout = null;
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.addEventListener('input', () => {
          clearTimeout(draftSaveTimeout);
          draftSaveTimeout = setTimeout(() => {
            if (!activeChat || activeChat.type === 'saved') return;
            const text = messageInput.value.trim();
            fetch('/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: activeChat.target, text }) }).catch(() => {});
          }, 1000);
        });
      }

      async function loadDraft(target) {
        try {
          const data = await loadJSON('/drafts');
          return data.drafts?.[target]?.text || '';
        } catch (e) { return ''; }
      }

      // ── Wallpaper Picker ──
      document.getElementById('wallpaperBtn')?.addEventListener('click', async () => {
        if (!activeChat) return;
        try {
          const data = await loadJSON('/wallpapers');
          const presets = data.presets || [];
          let html = '<div class="modal-overlay" id="wallpaperModal"><div class="modal" style="max-width:500px"><h2>Velg bakgrunn</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
          presets.forEach(p => {
            const safeCss = sanitizeWallpaperCss(p.css || '') || 'background:#0f1826;';
            html += '<div class="wallpaper-option" data-id="' + escapeHtml(p.id) + '" style="height:60px;border-radius:8px;border:2px solid #2a2d48;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#9ca3c7;transition:border-color .15s;' + safeCss + '">' + escapeHtml(p.name) + '</div>';
          });
          html += '</div><div class="modal-actions"><button class="btn btn-ghost" id="wallpaperCloseBtn">Lukk</button></div></div></div>';
          document.body.insertAdjacentHTML('beforeend', html);
          document.getElementById('wallpaperModal').querySelector('#wallpaperCloseBtn')?.addEventListener('click', () => document.getElementById('wallpaperModal')?.remove());
          document.getElementById('wallpaperModal').addEventListener('click', async (e) => {
            const opt = e.target.closest('.wallpaper-option');
            if (opt) {
              const wpId = opt.dataset.id;
              const chatType = activeChat.type === 'saved' ? 'user' : activeChat.type;
              const chatId = activeChat.type === 'saved' ? '__self__' : activeChat.target;
              await loadJSON('/wallpaper/' + chatType + '/' + encodeURIComponent(chatId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallpaper_id: wpId }) });
              applyWallpaper(wpId);
              toast('Bakgrunn endret', 'success');
              document.getElementById('wallpaperModal')?.remove();
            }
          });
        } catch (e) { toast('Kunne ikke laste bakgrunner'); }
      });

      function applyWallpaper(wpId) {
        const chatMain = document.querySelector('.chat-main');
        if (!chatMain) return;
        chatMain.className = 'chat-main';
        if (wpId && wpId !== 'default') chatMain.classList.add('wallpaper-' + wpId);
      }

      async function loadAndApplyWallpaper() {
        if (!activeChat || activeChat.type === 'saved') { applyWallpaper('default'); return; }
        try {
          const data = await loadJSON('/wallpaper/' + activeChat.type + '/' + encodeURIComponent(activeChat.target));
          applyWallpaper(data.wallpaper?.id || 'default');
        } catch (e) { applyWallpaper('default'); }
      }

      // ── Group Admin Panel ──
      document.getElementById('groupAdminBtn')?.addEventListener('click', async () => {
        if (!activeChat || activeChat.type !== 'group') return;
        const group = groups.find(g => g.id === activeChat.target);
        if (!group) return;
        const me = window.__APP__?.username || '';
        const isCreator = group.created_by === me;
        const isAdmin = (group.admins || []).includes(me);
        const groupDesc = group.description || '';
        let html = '<div class="modal-overlay" id="groupAdminModal"><div class="modal" style="max-width:500px"><h2>Gruppeinnstillinger</h2>';
        html += '<div class="group-info-section">'
          + (group.avatar ? '<img src="' + escapeHtml(group.avatar) + '" class="group-avatar-preview" />' : '<div class="group-avatar-placeholder">' + escapeHtml((group.name || 'G')[0]) + '</div>')
          + '<h3>' + escapeHtml(group.name) + '</h3>'
          + (groupDesc ? '<p class="group-desc">' + escapeHtml(groupDesc) + '</p>' : '<p class="group-desc muted">Ingen beskrivelse</p>')
          + '</div>';
        if (isCreator || isAdmin) {
          html += '<div class="field"><label>Beskrivelse</label><textarea id="groupDescInput" class="input-text" maxlength="200" style="min-height:48px;resize:vertical;">' + escapeHtml(groupDesc) + '</textarea></div>';
          html += '<div class="field"><label>Gruppebilde</label><div style="display:flex;gap:8px;align-items:center;">'
            + '<input type="file" id="groupAvatarInput" accept="image/png,image/jpeg,image/gif,image/webp" style="flex:1;" />'
            + '<button id="uploadGroupAvatarBtn" class="btn btn-primary btn-small">Last opp</button></div></div>';
        }
        html += '<div class="field"><label>Medlemmer (' + (group.members || []).length + ')</label><div id="memberList">';
        (group.members || []).forEach(m => {
          const isAdm = (group.admins || []).includes(m);
          const isMod = (group.mods || []).includes(m);
          const role = m === group.created_by ? 'Oppretter' : isAdm ? 'Admin' : isMod ? 'Mod' : '';
          html += '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">';
          html += '<span style="flex:1;">' + escapeHtml(m) + (role ? ' <span class="' + (isAdm ? 'admin-badge' : 'mod-badge') + '">' + role + '</span>' : '') + '</span>';
          if (isCreator && m !== group.created_by) {
            html += '<select class="input-text admin-role-select" data-user="' + escapeHtml(m) + '" style="width:100px;padding:4px;font-size:.8rem;">';
            html += '<option value="member"' + (!isAdm && !isMod ? ' selected' : '') + '>Medlem</option>';
            html += '<option value="mod"' + (isMod ? ' selected' : '') + '>Mod</option>';
            html += '<option value="admin"' + (isAdm ? ' selected' : '') + '>Admin</option>';
            html += '</select>';
            html += '<button class="btn btn-ghost btn-small remove-member-btn" data-user="' + escapeHtml(m) + '" style="color:#ef4444;border-color:#ef4444;font-size:.75rem;">Fjern</button>';
          } else if (m === me && !isCreator) {
            html += '<button class="btn btn-ghost btn-small leave-group-btn" style="color:#ef4444;border-color:#ef4444;font-size:.75rem;">Forlat</button>';
          }
          html += '</div>';
        });
        html += '</div></div>';
        if (isCreator || isAdmin) {
          html += '<div class="field"><label>Legg til medlem</label><div style="display:flex;gap:8px;">';
          html += '<input id="addMemberInput" class="input-text" placeholder="Brukernavn" style="flex:1;">';
          html += '<button id="addMemberBtn" class="btn btn-primary btn-small">Legg til</button></div></div>';
        }
        if (isCreator) {
          html += '<div class="field"><label>Sakte modus</label><select id="slowmodeSelect" class="input-text">';
          [0, 10, 30, 60, 120, 300, 600].forEach(s => {
            html += '<option value="' + s + '">' + (s === 0 ? 'Av' : s + ' sek') + '</option>';
          });
          html += '</select></div>';
          html += '<div class="field"><label>E2EE Nøkkel</label><button id="rotateKeyBtn" class="btn btn-ghost btn-small" style="border-color:var(--c-accent);">Roter nøkkel</button></div>';
        }
        html += '<div class="modal-actions"><button class="btn btn-ghost" id="groupAdminClose">Lukk</button></div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('groupAdminModal');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#groupAdminClose').addEventListener('click', () => modal.remove());
        if (isCreator || isAdmin) {
          const addBtn = modal.querySelector('#addMemberBtn');
          const addInput = modal.querySelector('#addMemberInput');
          if (addBtn && addInput) {
            addBtn.addEventListener('click', async () => {
              const username = addInput.value.trim().toLowerCase();
              if (!username) return;
              try {
                await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
                toast(username + ' lagt til', 'success');
                const data = await loadJSON('/groups');
                groups.length = 0;
                groups.push(...(data.groups || []));
                modal.remove();
                document.getElementById('groupAdminBtn').click();
              } catch (e) { toast('Kunne ikke legge til: ' + e.message); }
            });
          }
          const descInput = modal.querySelector('#groupDescInput');
          if (descInput) {
            let descTimer = null;
            descInput.addEventListener('input', () => {
              clearTimeout(descTimer);
              descTimer = setTimeout(async () => {
                try {
                  await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: descInput.value }) });
                  const data = await loadJSON('/groups');
                  groups.length = 0;
                  groups.push(...(data.groups || []));
                  renderGroups();
                } catch (e) {}
              }, 500);
            });
          }
          const uploadAvatarBtn = modal.querySelector('#uploadGroupAvatarBtn');
          const avatarInput = modal.querySelector('#groupAvatarInput');
          if (uploadAvatarBtn && avatarInput) {
            uploadAvatarBtn.addEventListener('click', async () => {
              const file = avatarInput.files[0];
              if (!file) { toast('Velg en fil forst'); return; }
              const form = new FormData();
              form.append('avatar', file);
              try {
                const res = await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/avatar', { method: 'POST', body: form });
                const data = await res.json();
                if (data.success) {
                  toast('Gruppebilde oppdatert', 'success');
                  modal.remove();
                  document.getElementById('groupAdminBtn').click();
                } else {
                  toast(data.message || 'Kunne ikke laste opp');
                }
              } catch (e) { toast('Opplasting feilet'); }
            });
          }
        }
        modal.querySelectorAll('.remove-member-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const user = btn.dataset.user;
            if (!confirm('Fjerne ' + user + '?')) return;
            try {
              await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/members/' + encodeURIComponent(user), { method: 'DELETE' });
              toast(user + ' fjernet', 'success');
              const data = await loadJSON('/groups');
              groups.length = 0;
              groups.push(...(data.groups || []));
              modal.remove();
              document.getElementById('groupAdminBtn').click();
            } catch (e) { toast('Kunne ikke fjerne'); }
          });
        });
        const leaveBtn = modal.querySelector('.leave-group-btn');
        if (leaveBtn) {
          leaveBtn.addEventListener('click', async () => {
            if (!confirm('Forlate gruppen?')) return;
            try {
              await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
              toast('Forlatt gruppe', 'success');
              modal.remove();
              activeChat = null;
              closeChat();
            } catch (e) { toast(e.message || 'Kunne ikke forlate'); }
          });
        }
        if (isCreator) {
          const rotateBtn = modal.querySelector('#rotateKeyBtn');
          if (rotateBtn) {
            rotateBtn.addEventListener('click', async () => {
              if (!confirm('Roter E2EE-nøkkel? Alle medlemmer må laste nøkler på nytt.')) return;
              try {
                await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/keys/rotate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                toast('Nøkkel rotert', 'success');
              } catch (e) { toast('Kunne ikke rotere nøkkel'); }
            });
          }
          const smSelect = modal.querySelector('#slowmodeSelect');
          if (smSelect) {
            try {
              const smData = await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/slowmode');
              smSelect.value = smData.seconds || 0;
            } catch (e) {}
            smSelect.addEventListener('change', async () => {
              await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/slowmode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seconds: parseInt(smSelect.value) }) });
              toast('Sakte modus oppdatert', 'success');
            });
          }
          modal.querySelectorAll('.admin-role-select').forEach(sel => {
            sel.addEventListener('change', async () => {
              const user = sel.dataset.user;
              const role = sel.value;
              await loadJSON('/groups/' + encodeURIComponent(activeChat.target) + '/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, role }) });
              toast(user + ' er nå ' + role, 'success');
              const data = await loadJSON('/groups');
              groups.length = 0;
              groups.push(...(data.groups || []));
              renderGroups();
            });
          });
        }
      });

      // ── Voice Message Waveform Players ──
      function formatDuration(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
      }

      function initVoicePlayers() {
        document.querySelectorAll('.voice-msg-player').forEach(player => {
          if (player._initialized) return;
          player._initialized = true;
          const src = player.dataset.src;
          if (!src) return;
          const canvas = player.querySelector('.voice-waveform');
          const playBtn = player.querySelector('.voice-play-btn');
          const durationEl = player.querySelector('.voice-duration');
          let audio = null;
          let playing = false;

          if (canvas) {
            const ctx = canvas.getContext('2d');
            const bars = 40;
            const barW = canvas.width / bars;
            for (let i = 0; i < bars; i++) {
              const h = Math.random() * 0.7 + 0.3;
              ctx.fillStyle = 'rgba(122,59,255,0.5)';
              ctx.fillRect(i * barW + 1, canvas.height * (1 - h) / 2, barW - 2, canvas.height * h);
            }
          }

          if (playBtn) {
            playBtn.addEventListener('click', async () => {
              if (playing && audio) {
                audio.pause();
                playBtn.textContent = '▶';
                playing = false;
                return;
              }
              if (!audio) {
                audio = new Audio(src);
                audio.addEventListener('loadedmetadata', () => {
                  if (durationEl) durationEl.textContent = formatDuration(audio.duration);
                });
                audio.addEventListener('ended', () => {
                  playBtn.textContent = '▶';
                  playing = false;
                });
              }
              await audio.play();
              playBtn.textContent = '⏸';
              playing = true;
            });
          }
        });
      }

      // ── @Mentions in Composer ──
      function showMentionDropdown(query, startPos) {
        hideMentionDropdown();
        const input = document.getElementById('messageInput');
        if (!input) return;
        const users = (window.__allUsers || []).map(u => typeof u === 'string' ? u : (u?.username || ''));
        const matches = users.filter(u => u && u.toLowerCase().startsWith(query.toLowerCase()) && u !== (window.__APP__?.username || '')).slice(0, 8);
        if (!matches.length) return;
        const dropdown = document.createElement('div');
        dropdown.id = 'mentionDropdown';
        dropdown.style.cssText = 'position:absolute;bottom:100%;left:0;right:0;background:var(--c-surface);border:1px solid var(--c-border);border-radius:10px;max-height:200px;overflow:auto;z-index:300;box-shadow:0 4px 12px rgba(0,0,0,.3);';
        matches.forEach(user => {
          const item = document.createElement('div');
          item.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:.9rem;color:var(--c-text);';
          item.textContent = '@' + user;
          item.addEventListener('mouseenter', () => item.style.background = 'var(--c-surface-hover)');
          item.addEventListener('mouseleave', () => item.style.background = '');
          item.addEventListener('click', () => {
            const val = input.value;
            const before = val.substring(0, startPos);
            const after = val.substring(input.selectionStart);
            input.value = before + '@' + user + ' ' + after;
            hideMentionDropdown();
            input.focus();
          });
          dropdown.appendChild(item);
        });
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(dropdown);
      }

      function hideMentionDropdown() {
        const existing = document.getElementById('mentionDropdown');
        if (existing) existing.remove();
      }

      const mentionInput = document.getElementById('messageInput');
      if (mentionInput) {
        mentionInput.addEventListener('input', (e) => {
          const val = e.target.value;
          const cursorPos = e.target.selectionStart;
          const beforeCursor = val.substring(0, cursorPos);
          const atMatch = beforeCursor.match(/@(\w*)$/);
          if (atMatch) {
            showMentionDropdown(atMatch[1], cursorPos - atMatch[0].length);
          } else {
            hideMentionDropdown();
          }
        });
      }

      // ── Hook into openChat/openGroup for new features ──
      async function updateNotifBtn(chatId, chatType) {
        const btn = document.getElementById('muteBtn');
        if (!btn) return;
        const override = getChatNotifOverride(chatId, chatType);
        if (override === 'always') { btn.textContent = '🔔✨'; btn.title = 'Alltid varsle'; }
        else if (override === 'never' || isMutedChat(chatId)) { btn.textContent = '🔇'; btn.title = 'Aldri varsle'; }
        else { btn.textContent = '🔔'; btn.title = 'Standard varsler'; }
      }

      async function loadAndApplyNotifOverride(chatId, chatType) {
        try {
          const data = await loadJSON('/notif/' + chatType + '/' + encodeURIComponent(chatId));
          if (data.success && data.override) {
            chatNotifOverrides[chatType + '_' + chatId] = data.override;
          }
        } catch(e) {}
        updateNotifBtn(chatId, chatType);
      }

      const _origOpenChat = openChat;
      openChat = async function(user) {
        await _origOpenChat(user);
        document.getElementById('wallpaperBtn').style.display = '';
        document.getElementById('groupAdminBtn').style.display = 'none';
        document.getElementById('pollBtn').style.display = 'none';
        document.getElementById('muteBtn').style.display = '';
        document.getElementById('chatSearchBtn').style.display = '';
        loadAndApplyNotifOverride(user, 'user');
        silentMode = false;
        if (silentToggle) { silentToggle.classList.remove('active'); silentToggle.textContent = '🔇'; }
        await loadAndApplyWallpaper();
        const draft = await loadDraft(user);
        if (draft) { const inp = document.getElementById('messageInput'); if (inp) inp.value = draft; }
        initVoicePlayers();
      };

      const _origOpenGroup = openGroup;
      openGroup = async function(groupId) {
        await _origOpenGroup(groupId);
        document.getElementById('wallpaperBtn').style.display = '';
        document.getElementById('groupAdminBtn').style.display = '';
        document.getElementById('muteBtn').style.display = '';
        document.getElementById('chatSearchBtn').style.display = '';
        loadAndApplyNotifOverride(groupId, 'group');
        await loadAndApplyWallpaper();
        initVoicePlayers();
      };

      const _origOpenSaved = openSavedMessages;
      openSavedMessages = async function() {
        await _origOpenSaved();
        document.getElementById('wallpaperBtn').style.display = 'none';
        document.getElementById('groupAdminBtn').style.display = 'none';
        document.getElementById('muteBtn').style.display = 'none';
      };

      document.getElementById('muteBtn').title = 'Standard varsler';

      async function setChatNotifOverride(chatId, chatType, override) {
        try {
          const res = await fetch('/notif/' + chatType + '/' + encodeURIComponent(chatId), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ override: override })
          });
          const data = await res.json();
          if (data.success) {
            const key = chatType + '_' + chatId;
            if (override === null) delete chatNotifOverrides[key];
            else chatNotifOverrides[key] = override;
          }
        } catch(e) {}
      }

      document.getElementById('muteBtn')?.addEventListener('click', async () => {
        if (!activeChat || !activeChat.target) return;
        const chatId = activeChat.target;
        const chatType = activeChat.type || 'user';
        const currentOverride = getChatNotifOverride(chatId, chatType);
        const currentlyMuted = isMutedChat(chatId);
        if (currentOverride === 'always') {
          await setChatNotifOverride(chatId, chatType, 'never');
          document.getElementById('muteBtn').textContent = '🔇';
          document.getElementById('muteBtn').title = 'Aldri varsle';
          toast('Aldri varsle for denne samtalen', 'success');
        } else if (currentOverride === 'never' || currentlyMuted) {
          if (currentlyMuted) {
            await fetch('/settings/mute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId, mute: false })
            });
            mutedChats = mutedChats.filter(id => id !== chatId);
          }
          await setChatNotifOverride(chatId, chatType, null);
          document.getElementById('muteBtn').textContent = '🔔';
          document.getElementById('muteBtn').title = 'Standard varsler';
          toast('Standard varsler gjenopprettet', 'success');
        } else {
          await setChatNotifOverride(chatId, chatType, 'always');
          document.getElementById('muteBtn').textContent = '🔔✨';
          document.getElementById('muteBtn').title = 'Alltid varsle';
          toast('Alltid varsle for denne samtalen', 'success');
        }
        renderUsers();
      });

      // (silent flag now injected directly in sendMessage body)

      // ── Show location messages on map ──
      function renderLocationHtml(locData) {
        try {
          const loc = typeof locData === 'string' ? JSON.parse(locData) : locData;
          const mapUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=' + (loc.lng - 0.01) + ',' + (loc.lat - 0.01) + ',' + (loc.lng + 0.01) + ',' + (loc.lat + 0.01) + '&layer=mapnik&marker=' + loc.lat + ',' + loc.lng;
          return '<div class="location-card"><iframe src="' + mapUrl + '" style="width:100%;height:140px;border:0;border-radius:8px;" loading="lazy"></iframe>'
            + (loc.label ? '<div class="loc-label">📍 ' + escapeHtml(loc.label) + '</div>' : '<div class="loc-label">📍 ' + loc.lat.toFixed(5) + ', ' + loc.lng.toFixed(5) + '</div>') + '</div>';
        } catch (e) { return ''; }
      }

      // Patch appendMessage to handle location and video types
      const _origFinishAppend2 = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText, parent) {
        if (message.type === 'location' && !message.deleted) {
          try {
            const loc = JSON.parse(message.ciphertext || message.text || '{}');
            const item = document.createElement('div');
            item.className = 'msg ' + (isMe ? 'sent' : 'received');
            if (message.id) item.dataset.messageId = message.id;
            item.dataset.msgId = message.id || '';
            const senderDisplay = getDisplayName(message.sender || '');
            item.innerHTML = '<div class="meta"><span class="sender">' + escapeHtml(senderDisplay) + '</span><span class="time">' + escapeHtml(formatTime(message.timestamp)) + '</span></div>'
              + renderLocationHtml(loc)
              + '<div class="meta">' + (isMe ? '<span class="read">' + (message.read ? '<span class="read-receipt read">✓✓</span>' : '<span class="read-receipt unread">✓</span>') + '</span>' : '') + '</div>';
            const box = parent || messagesBox;
            box.appendChild(item);
            if (!userScrolledUp) messagesBox.scrollTop = messagesBox.scrollHeight;
            return;
          } catch (e) {}
        }
        _origFinishAppend2(message, chatId, isMe, renderedText, parent);
      };

      // ── Swipe to reply (mobile) ──
      (function initSwipeToReply() {
        let startX = 0, startY = 0, swiping = false, targetMsg = null;
        const threshold = 80;
        const hint = document.createElement('div');
        hint.className = 'swipe-reply-hint';
        hint.textContent = '↪ Svar';
        document.body.appendChild(hint);

        messagesBox.addEventListener('touchstart', (e) => {
          const msg = e.target.closest('.msg');
          if (!msg || e.target.closest('.reaction-trigger') || e.target.closest('button')) return;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          targetMsg = msg;
          swiping = false;
        }, { passive: true });

        messagesBox.addEventListener('touchmove', (e) => {
          if (!targetMsg) return;
          const dx = e.touches[0].clientX - startX;
          const dy = Math.abs(e.touches[0].clientY - startY);
          if (dy > 30) { targetMsg = null; hint.classList.remove('visible'); return; }
          if (dx > 20) {
            swiping = true;
            const clamped = Math.min(dx, 120);
            targetMsg.style.transform = 'translateX(' + clamped + 'px)';
            targetMsg.style.transition = 'none';
            targetMsg.style.opacity = String(1 - (clamped / 200));
            hint.classList.toggle('visible', dx > threshold);
          }
        }, { passive: true });

        messagesBox.addEventListener('touchend', () => {
          if (targetMsg) {
            targetMsg.style.transition = 'transform .2s ease, opacity .2s ease';
            targetMsg.style.transform = '';
            targetMsg.style.opacity = '';
            if (swiping) {
              const msgId = targetMsg.dataset.msgId;
              if (msgId) {
                navigator.vibrate?.(10);
                const textEl = targetMsg.querySelector('.text, .msg-text');
                const senderEl = targetMsg.querySelector('.sender-name');
                replyingTo = msgId;
                const replyBar = document.getElementById('replyBar');
                if (replyBar) {
                  const preview = (textEl ? textEl.textContent : '').substring(0, 60);
                  const sender = senderEl ? senderEl.textContent : '';
                  replyBar.style.display = 'flex';
                  const replyText = replyBar.querySelector('.reply-text') || replyBar.querySelector('span');
                  if (replyText) replyText.textContent = 'Svar på ' + sender + ': ' + preview;
                }
                document.getElementById('messageInput')?.focus();
              }
            }
            hint.classList.remove('visible');
          }
          targetMsg = null;
          swiping = false;
        }, { passive: true });
      })();

      // ──────────────────────────────────────────────
      // STORIES BAR
      // ──────────────────────────────────────────────
      async function loadStories() {
        try {
          const data = await loadJSON('/stories');
          const stories = data.stories || [];
          renderStoriesBar(stories);
        } catch(e) {}
      }
      function renderStoriesBar(stories) {
        let bar = document.getElementById('storiesBar');
        if (!bar) {
          bar = document.createElement('div');
          bar.id = 'storiesBar';
          bar.style.cssText = 'display:flex;gap:12px;padding:10px 12px;overflow-x:auto;border-bottom:1px solid var(--c-border);scrollbar-width:none;';
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) sidebar.insertBefore(bar, sidebar.firstChild);
        }
        const me = window.__APP__?.username;
        const myStories = stories.filter(s => s.username === me);
        const otherStories = stories.filter(s => s.username !== me);
        let html = '';
        html += '<div data-action="create-story" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;flex-shrink:0;width:56px;" title="Ny story">';
        html += '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7a3bff,#cf6fef);display:flex;align-items:center;justify-content:center;font-size:1.3rem;border:2px solid var(--c-primary);">＋</div>';
        html += '<span style="font-size:.65rem;color:var(--c-text-muted);margin-top:2px;">Story</span></div>';
        if (myStories.length) {
          html += '<div data-story-id="' + escapeHtml(myStories[0].id) + '" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;flex-shrink:0;width:56px;">';
          html += '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#cf6fef,#7a3bff);display:flex;align-items:center;justify-content:center;font-size:1.1rem;border:2px solid #cf6fef;">👤</div>';
          html += '<span style="font-size:.65rem;color:var(--c-text-muted);margin-top:2px;">Din</span></div>';
        }
        otherStories.forEach(s => {
          html += '<div data-story-id="' + escapeHtml(s.id) + '" style="display:flex;flex-direction:column;align-items:center;cursor:pointer;flex-shrink:0;width:56px;">';
          html += '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1c6d4f,#1c3060);display:flex;align-items:center;justify-content:center;font-size:1.1rem;border:2px solid #7a3bff;">👤</div>';
          html += '<span style="font-size:.65rem;color:var(--c-text-muted);margin-top:2px;">' + escapeHtml(s.username).substring(0, 6) + '</span></div>';
        });
        bar.innerHTML = html;
        bar.style.display = stories.length ? 'flex' : 'none';
      }
      window._createStory = async function() {
        const content = prompt('Skriv din story:');
        if (!content) return;
        const bgColors = ['#1c1030','#301c1c','#1c3060','#1c6d4f','#6d4f1c'];
        const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
        try {
          await loadJSON('/stories', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, type:'text', bgColor, textColor:'#f3f1ff' }) });
          toast('Story publisert!');
          await loadStories();
        } catch(e) { toast('Kunne ikke publisere story'); }
      };
      window._viewStory = async function(storyId) {
        try {
          const data = await loadJSON('/stories');
          const stories = data.stories || [];
          const story = stories.find(s => s.id === storyId);
          if (!story) return;
          const safeColor = (c, fallback) => /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : fallback;
          const bgColor = safeColor(story.bgColor, '#1c1030');
          const textColor = safeColor(story.textColor, '#f3f1ff');
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:999999;';
          overlay.className = 'modal-overlay story-overlay';
          overlay.innerHTML = '<div class="story-card" style="background:' + bgColor + ';color:' + textColor + ';border-radius:16px;padding:40px;max-width:400px;width:90%;text-align:center;position:relative;">' +
            '<button class="story-close-btn" style="position:absolute;top:8px;right:12px;background:none;border:none;color:inherit;font-size:1.3rem;cursor:pointer;">✕</button>' +
            '<div style="font-size:.8rem;color:var(--c-text-muted);margin-bottom:12px;">' + escapeHtml(story.username) + ' · ' + formatTime(story.created) + '</div>' +
            '<div style="font-size:1.2rem;line-height:1.5;">' + escapeHtml(story.content) + '</div>' +
            '<div style="font-size:.75rem;color:var(--c-text-muted);margin-top:16px;">👁 ' + (story.views?.length || 0) + ' visninger</div></div>';
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.story-close-btn')) overlay.remove();
          });
          document.body.appendChild(overlay);
          await loadJSON('/stories/' + storyId + '/view', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
        } catch(e) {}
      };
      await loadStories();

      // ──────────────────────────────────────────────
      // CONTACTS PANEL
      // ──────────────────────────────────────────────
      async function loadContactsPanel() {
        try {
          const data = await loadJSON('/contacts');
          window._myContacts = data.contacts || [];
        } catch(e) { window._myContacts = []; }
      }
      window._showContacts = async function() {
        await loadContactsPanel();
        const contacts = window._myContacts || [];
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:999999;';
        let contactsHtml = contacts.map(c =>
          '<div class="contact-item" data-username="' + escapeHtml(c.username) + '" style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--c-border);border-radius:10px;background:var(--c-surface);cursor:pointer;">' +
            '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7a3bff,#cf6fef);display:flex;align-items:center;justify-content:center;font-size:.9rem;">👤</div>' +
            '<div style="flex:1;"><div style="font-weight:600;color:var(--c-text);font-size:.9rem;">' + escapeHtml(c.displayName) + '</div>' +
            '<div style="font-size:.75rem;color:var(--c-text-muted);">' + (c.phone || '') + (c.online ? ' · 🟢 online' : '') + '</div></div>' +
            '<button class="contact-remove-btn" data-username="' + escapeHtml(c.username) + '" style="background:none;border:none;color:var(--c-text-muted);cursor:pointer;font-size:.8rem;">✕</button></div>'
        ).join('');
        overlay.innerHTML = '<div style="background:var(--c-bg);border:1px solid var(--c-border);border-radius:16px;padding:24px;width:380px;max-width:95vw;max-height:80vh;overflow-y:auto;">' +
          '<h3 style="color:var(--c-text);margin:0 0 16px;">📒 Kontakter</h3>' +
          '<div style="display:flex;gap:6px;margin-bottom:16px;">' +
            '<input id="addContactUsername" class="input-text" placeholder="Brukernavn" style="flex:1;" />' +
            '<input id="addContactName" class="input-text" placeholder="Navn" style="flex:1;" />' +
            '<button class="btn btn-small btn-primary" id="addContactBtn">+</button></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' + (contactsHtml || '<div style="color:var(--c-text-muted);text-align:center;padding:20px;">Ingen kontakter ennå</div>') + '</div>' +
          '<button class="btn btn-ghost" id="contactsCloseBtn" style="width:100%;margin-top:16px;">Lukk</button></div>';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelectorAll('.contact-item').forEach(el => {
          el.addEventListener('click', (e) => {
            if (e.target.closest('.contact-remove-btn')) return;
            window._openChatFromContact(el.dataset.username);
            overlay.remove();
          });
        });
        overlay.querySelectorAll('.contact-remove-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window._removeContact(btn.dataset.username, btn);
          });
        });
        overlay.querySelector('#addContactBtn')?.addEventListener('click', () => window._addContact());
        overlay.querySelector('#contactsCloseBtn')?.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
      };
      window._addContact = async function() {
        const username = document.getElementById('addContactUsername')?.value?.trim();
        const name = document.getElementById('addContactName')?.value?.trim();
        if (!username) return toast('Skriv brukernavn');
        try {
          const res = await loadJSON('/contacts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, name: name||username }) });
          if (res.success) { toast('Kontakt lagt til!'); document.querySelector('.modal-overlay')?.remove(); window._showContacts(); }
          else toast(res.message);
        } catch(e) { toast('Feil'); }
      };
      window._removeContact = async function(username) {
        try { await loadJSON('/contacts/' + encodeURIComponent(username), { method:'DELETE' }); toast('Fjernet'); document.querySelector('.modal-overlay')?.remove(); window._showContacts(); } catch(e) {}
      };
      window._openChatFromContact = function(username) {
        const userItem = document.querySelector('.item[data-user="' + CSS.escape(username) + '"]');
        if (userItem) userItem.click();
      };

      // ──────────────────────────────────────────────
      // LIVE LOCATION SHARING
      // ──────────────────────────────────────────────
      window._shareLiveLocation = async function() {
        if (!activeChat) return toast('Velg en samtale først');
        const duration = parseInt(prompt('Varighet i minutter (1-60):', '10')) || 10;
        if (!navigator.geolocation) return toast('Posisjon ikke tilgjengelig');
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const res = await loadJSON('/location/live', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
              lat: pos.coords.latitude, lng: pos.coords.longitude,
              target: activeChat.target, targetType: activeChat.type,
              duration: duration * 60
            })});
            if (res.success) {
              toast('Deling startet! (' + duration + ' min)');
              const shareId = res.shareId;
              if (window._liveLocInterval) clearInterval(window._liveLocInterval);
              if (window._liveLocTimeout) clearTimeout(window._liveLocTimeout);
              window._liveLocInterval = setInterval(async () => {
                navigator.geolocation.getCurrentPosition(async (p) => {
                  await loadJSON('/location/live/' + shareId, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }) }).catch(()=>{});
                }).catch(()=>{});
              }, 10000);
              window._liveLocTimeout = setTimeout(() => { clearInterval(window._liveLocInterval); toast('Posisjonsdeling avsluttet'); }, duration * 60000);
            }
          } catch(e) { toast('Kunne ikke dele posisjon'); }
        }, () => toast('Kunne ikke hente posisjon'), { enableHighAccuracy: true });
      };

      // Add contacts & live location buttons to header
      const contactsBtn = document.createElement('button');
      contactsBtn.className = 'btn btn-small btn-ghost';
      contactsBtn.textContent = '📒';
      contactsBtn.title = 'Kontakter';
      contactsBtn.addEventListener('click', window._showContacts);
      const headerActions = document.querySelector('.header-actions');
      if (headerActions) headerActions.insertBefore(contactsBtn, headerActions.firstChild);

      // Attach live location to existing locationBtn
      const locBtn = document.getElementById('locationBtn');
      if (locBtn) {
        locBtn.addEventListener('dblclick', (e) => { e.preventDefault(); window._shareLiveLocation(); });
        locBtn.title = '📍 Enkelt · 📍📍 Dobbelklikk for live';
      }

      // Show contacts button in header if already set up
      await loadContactsPanel();

      // Add translate language picker to settings
      window._setTranslateLang = function(lang) { localStorage.setItem('translateLang', lang); toast('Oversettelsesspråk: ' + lang); };

      // ──────────────────────────────────────────────
      // DELETE CHOICE DIALOG
      // ──────────────────────────────────────────────
      function showDeleteChoice(msgId, msgEl) {
        document.querySelectorAll('.delete-choice').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999998;';
        const dialog = document.createElement('div');
        dialog.className = 'delete-choice';
        dialog.innerHTML = '<h3>Slette melding</h3>'
          + '<button class="del-everyone">🗑️ Slett for alle</button>'
          + '<button class="del-me">👤 Slett for meg</button>'
          + '<button class="del-cancel">Avbryt</button>';
        dialog.querySelector('.del-everyone').addEventListener('click', () => {
          overlay.remove();
          deleteMessageWithUndo(msgId, msgEl);
        });
        dialog.querySelector('.del-me').addEventListener('click', async () => {
          overlay.remove();
          try {
            await loadJSON('/messages/' + encodeURIComponent(msgId) + '/me', { method: 'DELETE' });
            if (msgEl) msgEl.remove();
            toast('Slettet for deg', 'success');
          } catch(e) { toast('Kunne ikke slette'); }
        });
        dialog.querySelector('.del-cancel').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
      }

      // ──────────────────────────────────────────────
      // DATE SEPARATORS
      // ──────────────────────────────────────────────
      var _lastDateSeparator = '';
      function getDateKey(ts) {
        if (!ts) return '';
        try { return ts.substring(0, 10); } catch(e) { return ''; }
      }
      function insertDateSeparator(ts, parent) {
        const key = getDateKey(ts);
        if (!key || key === _lastDateSeparator) return;
        _lastDateSeparator = key;
        const sep = document.createElement('div');
        sep.className = 'date-separator';
        const months = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'];
        try {
          const d = new Date(key + 'T12:00:00');
          sep.innerHTML = '<span>' + d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear() + '</span>';
        } catch(e) {
          sep.innerHTML = '<span>' + key + '</span>';
        }
        (parent || messagesBox).appendChild(sep);
      }
      function resetDateSeparators() { _lastDateSeparator = ''; }

      const _origFinishAppend3 = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText, parent) {
        if (!isMe || !message.deleted) insertDateSeparator(message.timestamp, parent);
        _origFinishAppend3(message, chatId, isMe, renderedText, parent);
        const item = messagesBox.lastElementChild;
        if (item && !message.deleted) {
          const timeEl = item.querySelector('.time');
          if (timeEl && message.timestamp) {
            timeEl.title = new Date(message.timestamp).toLocaleString('nb-NO');
          }
        }
      };

      // ──────────────────────────────────────────────
      // SCROLL TO BOTTOM BUTTON
      // ──────────────────────────────────────────────
      const scrollBtn = document.createElement('button');
      scrollBtn.className = 'scroll-bottom-btn';
      scrollBtn.innerHTML = '↓';
      scrollBtn.title = 'Bunn';
      document.body.appendChild(scrollBtn);
      scrollBtn.addEventListener('click', () => {
        messagesBox.scrollTop = messagesBox.scrollHeight;
        userScrolledUp = false;
        scrollBtn.classList.remove('visible');
      });
      messagesBox.addEventListener('scroll', () => {
        const atBottom = messagesBox.scrollHeight - messagesBox.scrollTop - messagesBox.clientHeight < 100;
        scrollBtn.classList.toggle('visible', !atBottom && messagesBox.scrollHeight > messagesBox.clientHeight * 1.5);
      });

      // ──────────────────────────────────────────────
      // MEDIA VIEWER (fullscreen images)
      // ──────────────────────────────────────────────
      messagesBox.addEventListener('click', (e) => {
        const img = e.target.closest('.inline-image img');
        if (!img) return;
        e.stopPropagation();
        const viewer = document.createElement('div');
        viewer.className = 'media-viewer';
        viewer.innerHTML = '<button class="media-viewer-close">✕</button><img src="' + img.src + '" />';
        viewer.querySelector('.media-viewer-close').addEventListener('click', () => viewer.remove());
        viewer.addEventListener('click', (ev) => { if (ev.target === viewer) viewer.remove(); });
        document.body.appendChild(viewer);
      });

      // ──────────────────────────────────────────────
      // CHAT INFO PANEL
      // ──────────────────────────────────────────────
      async function openChatInfo() {
        document.querySelectorAll('.chat-info-panel').forEach(el => el.remove());
        if (!activeChat) return;
        const panel = document.createElement('div');
        panel.className = 'chat-info-panel';
        panel.innerHTML = '<div style="text-align:center;padding:40px;color:var(--c-text-muted);">Laster...</div>';
        document.body.appendChild(panel);
        try {
          let infoHtml = '';
          if (activeChat.type === 'user') {
            const username = activeChat.target;
            const display = getDisplayName(username);
            const bio = window._myContacts?.find(c => c.username === username)?.notes || '';
            const lastSeen = window._myContacts?.find(c => c.username === username)?.lastSeen || '';
            const online = window._myContacts?.find(c => c.username === username)?.online || false;
            const blockData = await loadJSON('/blocked/check/' + username);
            infoHtml = '<div class="info-avatar" style="background:linear-gradient(135deg,#7a3bff,#cf6fef);">👤</div>'
              + '<div class="info-name">' + escapeHtml(display) + '</div>'
              + '<div class="info-username">@' + escapeHtml(username) + '</div>'
              + '<div class="info-bio">' + (bio ? escapeHtml(bio) : 'Ingen bio satt') + '</div>'
              + '<div style="text-align:center;font-size:.8rem;color:var(--c-text-muted);">' + (online ? '🟢 Online' : (lastSeen ? 'Sist sett: ' + formatTime(lastSeen) : 'Sist sett: Ukjent')) + '</div>'
              + '<div class="info-section">'
              + '<button class="btn btn-ghost block-user-btn" data-username="' + escapeHtml(username) + '" style="width:100%;' + (blockData.iBlocked ? 'color:#ff6666;' : '') + '">'
              + (blockData.iBlocked ? '🔓 Lås opp bruker' : '🚫 Blokker bruker') + '</button></div>'
              + '<div class="info-section"><div class="info-section-title">FELLES MEDIER</div>'
              + '<div id="sharedMediaList" style="color:var(--c-text-muted);font-size:.82rem;">Laster...</div></div>';
          } else if (activeChat.type === 'group') {
            const gid = activeChat.target;
            const membersData = await loadJSON('/groups/' + encodeURIComponent(gid) + '/members');
            const members = membersData.members || [];
            const inviteData = await loadJSON('/groups/' + encodeURIComponent(gid) + '/invite-link');
            infoHtml = '<div class="info-avatar" style="background:linear-gradient(135deg,#1c6d4f,#1c3060);">👥</div>'
              + '<div class="info-name">' + escapeHtml(activeChat.displayName || gid) + '</div>'
              + '<div class="info-username">' + members.length + ' medlemmer</div>'
              + '<div class="info-section">'
              + '<div class="info-section-title">MEDLEMMER</div>'
              + members.map(m => '<div class="member-item"><div class="member-avatar' + (m.role==='owner'?' avatar-gradient-owner':m.role==='admin'?' avatar-gradient-admin':'') + '">' + escapeHtml(m.username[0].toUpperCase()) + '</div>'
                + '<div><div style="font-size:.85rem;color:var(--c-text);">' + escapeHtml(m.displayName || m.username) + (m.role!=='member'?' <span class="'+m.role+'-badge">' + m.role + '</span>':'') + '</div>'
                + '<div style="font-size:.72rem;color:var(--c-text-muted);">' + (m.online ? '🟢 Online' : (m.lastSeen ? formatTime(m.lastSeen) : '')) + '</div></div></div>').join('')
              + '</div>';
            if (inviteData.success && inviteData.inviteLink) {
              infoHtml += '<div class="info-section"><div class="info-section-title">INVITASJONSLINK</div>'
                + '<div style="display:flex;gap:6px;"><input value="' + escapeHtml(inviteData.inviteLink) + '" readonly style="flex:1;padding:8px;border:1px solid var(--c-border);border-radius:8px;background:var(--c-surface);color:var(--c-text);font-size:.78rem;" />'
                + '<button class="btn btn-small btn-primary copy-invite-btn">📋</button></div></div>';
            }
          } else if (activeChat.type === 'channel') {
            infoHtml = '<div class="info-avatar" style="background:linear-gradient(135deg,#6d4f1c,#1c6d4f);">📢</div>'
              + '<div class="info-name">' + escapeHtml(activeChat.displayName || activeChat.target) + '</div>'
              + '<div class="info-username">Kanal</div>';
          }
          panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><button class="info-close-btn" style="background:none;border:none;color:var(--c-text);font-size:1.2rem;cursor:pointer;">✕</button><span style="font-weight:600;color:var(--c-text);">Informasjon</span></div>' + infoHtml;
          panel.querySelector('.info-close-btn')?.addEventListener('click', () => panel.remove());
          panel.querySelector('.block-user-btn')?.addEventListener('click', function() {
            window._toggleBlock(this.dataset.username, this);
          });
          panel.querySelectorAll('.info-avatar, .info-name').forEach(el => {
            el.style.cursor = 'default';
          });
        } catch(e) {
          panel.innerHTML = '<div style="text-align:center;padding:40px;color:var(--c-text-muted);">Kunne ikke laste info</div>';
        }
      }
      window._toggleBlock = async function(username, btn) {
        try {
          const data = await loadJSON('/blocked/check/' + username);
          if (data.iBlocked) {
            await loadJSON('/block/' + username, { method: 'DELETE' });
            toast('Bruker låst opp');
            btn.textContent = '🚫 Blokker bruker';
            btn.style.color = '';
          } else {
            if (!confirm('Blokker ' + username + '?')) return;
            await loadJSON('/block/' + username, { method: 'POST' });
            toast('Bruker blokkert');
            btn.textContent = '🔓 Lås opp bruker';
            btn.style.color = '#ff6666';
          }
        } catch(e) { toast('Feil'); }
      };
      document.getElementById('chatTitle')?.addEventListener('click', openChatInfo);
      document.getElementById('chatMeta')?.addEventListener('click', openChatInfo);

      // ──────────────────────────────────────────────
      // BULK MESSAGE SELECTION
      // ──────────────────────────────────────────────
      let bulkMode = false;
      let bulkToolbar = null;

      function enterBulkMode() {
        bulkMode = true;
        selectedMessages.clear();
        if (!bulkToolbar) {
          bulkToolbar = document.createElement('div');
          bulkToolbar.className = 'bulk-toolbar';
          bulkToolbar.innerHTML = '<span class="bulk-count">0 valgt</span><div class="bulk-actions">'
            + '<button class="btn btn-small btn-primary" id="bulkForwardBtn">↪ Videresend</button>'
            + '<button class="btn btn-small btn-ghost" id="bulkDeleteBtn" style="color:#ff6666;">🗑️ Slett</button>'
            + '<button class="btn btn-small btn-ghost" id="bulkCancelBtn">Avbryt</button></div>';
          document.body.appendChild(bulkToolbar);
          bulkToolbar.querySelector('#bulkCancelBtn').addEventListener('click', exitBulkMode);
          bulkToolbar.querySelector('#bulkDeleteBtn').addEventListener('click', async () => {
            if (!confirm('Slette ' + selectedMessages.size + ' meldinger?')) return;
            for (const id of selectedMessages) {
              await fetch('/messages/' + encodeURIComponent(id), { method: 'DELETE' }).catch(()=>{});
            }
            selectedMessages.forEach(id => {
              const el = messagesBox.querySelector('[data-msg-id="' + CSS.escape(id) + '"]');
              if (el) el.remove();
            });
            toast(selectedMessages.size + ' meldinger slettet');
            exitBulkMode();
          });
          bulkToolbar.querySelector('#bulkForwardBtn').addEventListener('click', () => {
            if (selectedMessages.size === 1) forwardMsg([...selectedMessages][0]);
            else toast('Videresend én om gangen');
          });
        }
        bulkToolbar.classList.add('visible');
        messagesBox.querySelectorAll('.msg').forEach(msg => {
          if (!msg._bulkListenerAttached) {
            msg._bulkListenerAttached = true;
            msg.addEventListener('click', toggleBulkSelect);
          }
        });
      }
      function exitBulkMode() {
        bulkMode = false;
        selectedMessages.clear();
        if (bulkToolbar) bulkToolbar.classList.remove('visible');
        messagesBox.querySelectorAll('.msg.selected').forEach(el => el.classList.remove('selected'));
      }
      function toggleBulkSelect(e) {
        if (!bulkMode) return;
        e.stopPropagation();
        const msgId = this.dataset.msgId;
        if (!msgId) return;
        if (selectedMessages.has(msgId)) {
          selectedMessages.delete(msgId);
          this.classList.remove('selected');
        } else {
          selectedMessages.add(msgId);
          this.classList.add('selected');
        }
        const count = bulkToolbar.querySelector('.bulk-count');
        if (count) count.textContent = selectedMessages.size + ' valgt';
        if (selectedMessages.size === 0) exitBulkMode();
      }

      // ──────────────────────────────────────────────
      // CALL DURATION DISPLAY
      // ──────────────────────────────────────────────
      let _callTimerInterval = null;
      let _callStartTime = null;
      function startCallTimer() {
        _callStartTime = Date.now();
        _callTimerInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - _callStartTime) / 1000);
          const min = Math.floor(elapsed / 60);
          const sec = elapsed % 60;
          const el = document.querySelector('.call-duration');
          if (el) el.textContent = String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
        }, 1000);
      }
      function stopCallTimer() {
        if (_callTimerInterval) { clearInterval(_callTimerInterval); _callTimerInterval = null; }
        _callStartTime = null;
      }
      const _origUpdateCallStatus = updateCallStatus;
      updateCallStatus = function(status) {
        _origUpdateCallStatus(status);
        if (status === 'Tilkoblet' && !_callTimerInterval) {
          startCallTimer();
          const header = document.querySelector('.call-header');
          if (header && !header.querySelector('.call-duration')) {
            const dur = document.createElement('div');
            dur.className = 'call-duration';
            dur.textContent = '00:00';
            header.appendChild(dur);
          }
        }
        if (status === 'Samtale avsluttet' || status === 'Avbrutt') stopCallTimer();
      };
      const _origRemoveCallOverlay = removeCallOverlay;
      removeCallOverlay = function() { stopCallTimer(); _origRemoveCallOverlay(); };

      // ──────────────────────────────────────────────
      // CTRL+K QUICK CHAT SWITCHER
      // ──────────────────────────────────────────────
      function openChatSwitcher() {
        document.querySelectorAll('.chat-switcher, .cs-overlay').forEach(el => el.remove());
        const overlay = document.createElement('div');
        overlay.className = 'cs-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999998;';
        const switcher = document.createElement('div');
        switcher.className = 'chat-switcher';
        switcher.innerHTML = '<input id="csInput" placeholder="Søk samtale..." autofocus />'
          + '<div id="csResults" class="chat-switcher-results"></div>';
        overlay.appendChild(switcher);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
        const input = document.getElementById('csInput');
        const results = document.getElementById('csResults');
        function renderCSResults(query) {
          const q = (query || '').toLowerCase();
          let items = [];
          const allUsers = window.__allUsers || [];
          const allGroups = window.__allGroups || [];
          const allChannels = window.__allChannels || [];
          allUsers.forEach(u => {
            if (u === window.__APP__?.username) return;
            const dn = getDisplayName(u);
            if (!q || u.includes(q) || dn.toLowerCase().includes(q)) {
              items.push({ type:'user', username:u, name:dn, icon:'👤' });
            }
          });
          allGroups.forEach(g => {
            const gn = g.name || g.id;
            if (!q || gn.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)) {
              items.push({ type:'group', id:g.id, name:gn, icon:'👥' });
            }
          });
          allChannels.forEach(c => {
            const cn = c.name || c.id;
            if (!q || cn.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) {
              items.push({ type:'channel', id:c.id, name:cn, icon:'📢' });
            }
          });
          results.innerHTML = items.slice(0, 20).map((item, i) =>
            '<div class="chat-switcher-item' + (i===0?' active':'') + '" data-type="' + item.type + '" data-target="' + escapeHtml(item.type==='user'?item.username:item.id) + '">'
            + '<div class="cs-avatar">' + item.icon + '</div>'
            + '<div><div class="cs-name">' + escapeHtml(item.name) + '</div>'
            + '<div class="cs-sub">' + item.type + '</div></div></div>'
          ).join('') || '<div style="padding:16px;text-align:center;color:var(--c-text-muted);">Ingen treff</div>';
          results.querySelectorAll('.chat-switcher-item').forEach(el => {
            el.addEventListener('click', () => {
              overlay.remove();
              const type = el.dataset.type;
              const target = el.dataset.target;
              if (type === 'user') {
                const item = document.querySelector('.item[data-user="' + CSS.escape(target) + '"]');
                if (item) item.click();
              } else if (type === 'group') {
                const item = document.querySelector('.item[data-group-id="' + CSS.escape(target) + '"]');
                if (item) item.click();
              }
            });
          });
        }
        renderCSResults('');
        input.addEventListener('input', () => renderCSResults(input.value));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') { overlay.remove(); return; }
          const active = results.querySelector('.chat-switcher-item.active');
          const all = results.querySelectorAll('.chat-switcher-item');
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            let next = active?.nextElementSibling;
            if (!next) next = all[0];
            all.forEach(el => el.classList.remove('active'));
            if (next) next.classList.add('active');
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let prev = active?.previousElementSibling;
            if (!prev) prev = all[all.length - 1];
            all.forEach(el => el.classList.remove('active'));
            if (prev) prev.classList.add('active');
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (active) active.click();
          }
        });
      }
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const sb = document.getElementById('sidebarSearch');
          if (sb) { sb.focus(); sb.select(); }
        }
      });

      // ──────────────────────────────────────────────
      // CHANNEL SUBSCRIBERS PANEL
      // ──────────────────────────────────────────────
      window._showChannelSubscribers = async function(channelId) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:999999;';
        overlay.innerHTML = '<div class="channel-subscribers-panel" style="background:var(--c-bg);border:1px solid var(--c-border);border-radius:16px;padding:24px;width:360px;max-width:95vw;max-height:70vh;overflow-y:auto;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><h3 style="margin:0;color:var(--c-text);">📢 Abonnenter</h3><button class="channel-sub-close" style="background:none;border:none;color:var(--c-text);font-size:1.2rem;cursor:pointer;">✕</button></div><div id="channelSubList" style="color:var(--c-text-muted);text-align:center;">Laster...</div></div>';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target.closest('.channel-sub-close')) overlay.remove(); });
        try {
          const data = await loadJSON('/channels/' + encodeURIComponent(channelId));
          const subs = data.channel?.subscribers || [];
          document.getElementById('channelSubList').innerHTML = subs.length
            ? subs.map(s => '<div style="display:flex;align-items:center;gap:8px;padding:8px;"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3390ec,#5b8def);display:flex;align-items:center;justify-content:center;font-size:.7rem;">👤</div><span style="color:var(--c-text);font-size:.85rem;">' + escapeHtml(s) + '</span></div>').join('')


            : '<div>Ingen abonnenter</div>';
        } catch(e) { document.getElementById('channelSubList').textContent = 'Feil ved lasting'; }
      };

      // ──────────────────────────────────────────────
      // ANDROID BACK BUTTON + DEEP LINKING
      // ──────────────────────────────────────────────
      window.addEventListener('popstate', (e) => {
        const panel = document.querySelector('.chat-info-panel');
        if (panel) { panel.remove(); return; }
        const mediaViewer = document.querySelector('.media-viewer');
        if (mediaViewer) { mediaViewer.remove(); return; }
        const overlay = document.querySelector('.cs-overlay');
        if (overlay) { overlay.remove(); return; }
        const deleteChoice = document.querySelector('.delete-choice');
        if (deleteChoice?.parentElement) { deleteChoice.parentElement.remove(); return; }
        const emojiPicker = document.getElementById('fullEmojiPicker');
        if (emojiPicker?.classList.contains('open')) { emojiPicker.classList.remove('open'); return; }
        if (activeChat) { closeChat(); return; }
      });
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        let targetMsgId = '';
        const parts = hash.split('&');
        for (const p of parts) {
          if (p.startsWith('mid=')) targetMsgId = decodeURIComponent(p.substring(4));
        }
        const route = parts[0] || '';
        const scrollToTarget = () => {
          if (!targetMsgId) return;
          const tryScroll = () => {
            const el = messagesBox.querySelector('[data-msg-id="' + CSS.escape(targetMsgId) + '"]');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('msg-flash');
              setTimeout(() => el.classList.remove('msg-flash'), 2500);
              return;
            }
            if (window.__scrollAttempts === undefined) window.__scrollAttempts = 0;
            if (window.__scrollAttempts++ < 60) setTimeout(tryScroll, 100);
          };
          setTimeout(tryScroll, 300);
        };
        if (route.startsWith('chat/')) {
          const user = decodeURIComponent(route.substring(5));
          const item = document.querySelector('.item[data-user="' + CSS.escape(user) + '"]');
          if (item) setTimeout(() => { item.click(); scrollToTarget(); }, 100);
        } else if (route.startsWith('group/')) {
          const gid = decodeURIComponent(route.substring(6));
          const item = document.querySelector('.item[data-group-id="' + CSS.escape(gid) + '"]');
          if (item) setTimeout(() => { item.click(); scrollToTarget(); }, 100);
        }
      }

      // ──────────────────────────────────────────────
      // VIRTUAL KEYBOARD VIEWPORT FIX
      // ──────────────────────────────────────────────
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          const composer = document.getElementById('composer');
          const chatMain = document.querySelector('.chat-main');
          if (composer && window.visualViewport) {
            const kbHeight = window.innerHeight - window.visualViewport.height;
            if (kbHeight > 50) {
              composer.style.bottom = '0px';
              composer.style.position = 'sticky';
              if (chatMain) chatMain.scrollTop = chatMain.scrollHeight;
            }
          }
        });
      }

      // ──────────────────────────────────────────────
      // CLICKABLE LINKS IN MESSAGES
      // ──────────────────────────────────────────────
      function linkifyText(text) {
        return text
          .replace(/(https?:\/\/[^\s<]+)/g, (match) => '<a href="' + match.replace(/"/g, '%22') + '" target="_blank" rel="noopener noreferrer" style="color:#5b8def;text-decoration:underline;word-break:break-all;">' + match + '</a>')
          .replace(/@(\w+)/g, '<span style="color:#3390ec;font-weight:500;">@$1</span>');
      }

      // Patch finishAppend to use linkifyText
      const _origFinishAppend4 = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText, parent) {
        _origFinishAppend4(message, chatId, isMe, renderedText, parent);
        const lastMsg = messagesBox.lastElementChild;
        if (lastMsg && !message.deleted) {
          const textEl = lastMsg.querySelector('.msg-text');
          if (textEl && renderedText && !message.deleted) {
            textEl.innerHTML = linkifyText(renderedText);
          }
        }
      };

      // ──────────────────────────────────────────────
      // CLICKABLE LINK PREVIEW CARDS
      // ──────────────────────────────────────────────
      const _origRenderLinkPreview = renderLinkPreview;
      renderLinkPreview = function(preview) {
        if (!preview) return '';
        const html = _origRenderLinkPreview(preview);
        return '<a href="' + escapeHtml(preview.url) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;display:block;">' + html + '</a>';
      };

      // ──────────────────────────────────────────────
      // HAPTIC FEEDBACK + CONTEXT MENU BOUNDS
      // ──────────────────────────────────────────────
      const _origShowQuickActions = showQuickActions;
      showQuickActions = function(msgEl, x, y) {
        navigator.vibrate?.(15);
        const menuWidth = 180, menuHeight = 320;
        let posX = Math.min(x, window.innerWidth - menuWidth - 8);
        let posY = Math.min(y, window.innerHeight - menuHeight - 8);
        posX = Math.max(8, posX);
        posY = Math.max(8, posY);
        _origShowQuickActions(msgEl, posX, posY);
      };

      // ── In-Chat Search ──
      let searchMatches = [];
      let searchIndex = -1;

      document.getElementById('chatSearchBtn')?.addEventListener('click', () => {
        const bar = document.getElementById('chatSearchBar');
        if (!bar) return;
        const visible = bar.style.display !== 'none';
        bar.style.display = visible ? 'none' : 'flex';
        if (!visible) {
          document.getElementById('chatSearchInput')?.focus();
        } else {
          clearSearchHighlights();
        }
      });

      document.getElementById('chatSearchClose')?.addEventListener('click', () => {
        document.getElementById('chatSearchBar').style.display = 'none';
        clearSearchHighlights();
      });

      document.getElementById('chatSearchInput')?.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim().toLowerCase();
        clearSearchHighlights();
        if (!query) { updateSearchCount(0, -1); return; }
        searchMatches = [];
        searchIndex = -1;
        messagesBox.querySelectorAll('.msg').forEach(msg => {
          const textEl = msg.querySelector('.text');
          if (!textEl) return;
          const text = textEl.textContent || '';
          if (!text.toLowerCase().includes(query)) return;
          const idx = text.toLowerCase().indexOf(query);
          const before = text.substring(0, idx);
          const match = text.substring(idx, idx + query.length);
          const after = text.substring(idx + query.length);
          textEl.innerHTML = escapeHtml(before) + '<span class="search-highlight">' + escapeHtml(match) + '</span>' + escapeHtml(after);
          searchMatches.push(msg);
        });
        if (searchMatches.length > 0) {
          searchIndex = 0;
          searchMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        updateSearchCount(searchMatches.length, searchIndex);
      });

      document.getElementById('chatSearchNext')?.addEventListener('click', () => {
        if (!searchMatches.length) return;
        searchIndex = (searchIndex + 1) % searchMatches.length;
        searchMatches[searchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        updateSearchCount(searchMatches.length, searchIndex);
      });

      document.getElementById('chatSearchPrev')?.addEventListener('click', () => {
        if (!searchMatches.length) return;
        searchIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length;
        searchMatches[searchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        updateSearchCount(searchMatches.length, searchIndex);
      });

      function updateSearchCount(total, idx) {
        const el = document.getElementById('chatSearchCount');
        if (el) el.textContent = total > 0 ? (idx + 1) + '/' + total : (total === 0 && document.getElementById('chatSearchInput')?.value ? '0 treff' : '');
      }

      function clearSearchHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
          el.replaceWith(document.createTextNode(el.textContent));
        });
        searchMatches = [];
        searchIndex = -1;
        updateSearchCount(0, -1);
      }

      await loadFolders();
      await loadPinnedChats();
      await loadMutedChats();
      await loadBlockedUsers();
      await loadChatNotifOverrides();
      await loadChannels();
      await loadLabels();
      await loadArchived();
      renderUsers();
      renderGroups();
      renderChannels();

      // ── App Lock ──
      checkAppLock();

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) sessionStorage.removeItem('app-locked');
        else { const pin = localStorage.getItem('app-pin'); if (pin) { sessionStorage.removeItem('app-locked'); checkAppLock(); } }
      });

      document.getElementById('lockToggle')?.addEventListener('click', () => {
        if (localStorage.getItem('app-pin')) {
          if (confirm('Fjern PIN-kode?')) {
            localStorage.removeItem('app-pin');
            sessionStorage.removeItem('app-locked');
            toast('PIN fjernet', 'success');
          }
        } else {
          showLockScreen();
        }
      });

      // ── Stealth mode ──
      document.body.classList.toggle('stealth-mode', stealthMode);
      document.getElementById('stealthToggle')?.addEventListener('click', toggleStealthMode);

      // ── Global Search ──
      document.getElementById('globalSearchBtn')?.addEventListener('click', showGlobalSearch);

      // ── AI summary ──
      document.getElementById('aiSummaryBtn')?.addEventListener('click', async () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = '<div style="background:#17213b;border-radius:16px;padding:24px;max-width:420px;width:90%;text-align:center;"><div style="font-size:3rem;margin:8px 0;">🤖</div><h3 style="color:#e7e8f3;margin:8px 0;">AI-sammendrag</h3><div id="aiSummaryBody" style="color:#aab6c4;font-size:.9rem;line-height:1.5;max-height:300px;overflow:auto;text-align:left;white-space:pre-wrap;">Laster... </div><button id="aiSummaryCloseBtn" style="margin-top:12px;padding:8px 20px;background:#3390ec;border:none;border-radius:8px;color:#fff;cursor:pointer;">Lukk</button></div>';
        document.body.appendChild(overlay);
        overlay.querySelector('#aiSummaryCloseBtn')?.addEventListener('click', () => overlay.remove());
        const body = overlay.querySelector('#aiSummaryBody');
        try {
          const d = await loadJSON('/ai/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          let html = escapeHtml(d.summary || 'Ingen oppsummering.');
          if (d.chats && d.chats.length) {
            html += '\n\n';
            d.chats.forEach(c => {
              html += '— ' + escapeHtml(c.name) + ' (' + c.count + ' ulest)\n';
              c.last.forEach(m => {
                const t = escapeHtml(m.text || '').substring(0, 80);
                html += '  ' + escapeHtml(m.sender) + ': ' + t + '\n';
              });
            });
          }
          body.textContent = '';
          body.innerHTML = html;
        } catch(e) {
          body.textContent = e.message || 'Kunne ikke lage sammendrag.';
        }
      });

      if (document.getElementById('mobileBackBtn')) {
        document.getElementById('mobileBackBtn').addEventListener('click', () => closeChat());
      }
      if (document.getElementById('chatBackBtn')) {
        document.getElementById('chatBackBtn').addEventListener('click', () => closeChat());
      }
      const selCancelBtn = document.getElementById('selCancelBtn');
      if (selCancelBtn) selCancelBtn.addEventListener('click', () => exitSelectionMode());
      const selDeleteBtn = document.getElementById('selDeleteBtn');
      if (selDeleteBtn) selDeleteBtn.addEventListener('click', async () => {
        const ids = [...selectedMessages];
        if (!ids.length) return;
        if (!confirm('Slett ' + ids.length + ' melding(er)?')) return;
        for (const id of ids) { await deleteMessage(id); }
        exitSelectionMode();
      });
      const selForwardBtn = document.getElementById('selForwardBtn');
      if (selForwardBtn) selForwardBtn.addEventListener('click', () => {
        const ids = [...selectedMessages];
        if (!ids.length) return;
        forwardMsg(ids[0]);
        exitSelectionMode();
      });

      document.getElementById('sidebarSearch')?.addEventListener('input', debounce((e) => {
        filterSidebar(e.target.value);
      }, 200));

      // ── Sidebar context menu (labels) ──
      document.querySelectorAll('#usersList, #groupsList, #channelsList').forEach(list => {
        list.addEventListener('contextmenu', (e) => {
          const item = e.target.closest('.item');
          if (!item) return;
          e.preventDefault();
          document.querySelectorAll('.context-menu').forEach(el => el.remove());
          const chatId = item.dataset.user || item.dataset.groupId || '';
          if (!chatId) return;
          const chatType = item.dataset.user ? 'user' : 'group';
          const isArchived = archivedChats.some(e => e.target === chatId && e.type === chatType);
          const labels = chatLabels[chatId] || [];
          const menu = document.createElement('div');
          menu.className = 'context-menu sidebar-label-menu';
          const menuId = 'labelMenu_' + Date.now();
          menu.innerHTML = '<button class="ctx-item ctx-archive">' + (isArchived ? '📂 Avarkiver' : '📁 Arkiver') + '</button>'
            + '<div class="ctx-sep"></div>'
            + '<div class="ctx-section-title">🏷️ Etiketter</div>'
            + '<input class="sidebar-label-input label-input" placeholder="Ny etikett..." maxlength="20" />'
            + '<button class="ctx-item label-add-btn">➕ Legg til</button>'
            + (labels.length ? '<div class="ctx-sep"></div>' + labels.map(l => '<button class="ctx-item label-remove" data-label="' + escapeHtml(l) + '">✕ ' + escapeHtml(l) + '</button>').join('') : '<div class="ctx-empty">Ingen etiketter</div>');
          document.body.appendChild(menu);
          const rect = menu.getBoundingClientRect();
          menu.style.left = Math.min(e.clientX, window.innerWidth - rect.width - 8) + 'px';
          menu.style.top = Math.min(e.clientY, window.innerHeight - rect.height - 8) + 'px';
          menu.querySelector('.ctx-archive')?.addEventListener('click', async () => {
            if (isArchived) await unarchiveChat(chatId, chatType);
            else await toggleArchive(chatId, chatType);
            menu.remove();
          });
          const input = menu.querySelector('.label-input');
          if (input) { input.focus(); input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') menu.querySelector('.label-add-btn')?.click(); }); }
          menu.querySelector('.label-add-btn')?.addEventListener('click', async () => {
            const val = input?.value.trim();
            if (!val) return;
            await saveLabel(chatId, val);
            renderUsers(); renderGroups();
            menu.remove();
          });
          menu.querySelectorAll('.label-remove').forEach(btn => {
            btn.addEventListener('click', async () => {
              const label = btn.dataset.label;
              await saveLabel(chatId, label);
              renderUsers(); renderGroups();
              menu.remove();
            });
          });
          setTimeout(() => {
            const close = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); } };
            document.addEventListener('click', close);
          }, 10);
        });
      });

      // ── Quick message templates ──
      function saveTemplate(text) {
        const templates = JSON.parse(localStorage.getItem('chat-templates') || '[]');
        const template = { id: Date.now().toString(36), text: text.substring(0, 200), createdAt: Date.now() };
        templates.push(template);
        localStorage.setItem('chat-templates', JSON.stringify(templates));
        toast('Mal lagret', 'success');
        renderTemplates();
      }

      function saveSelectedTextAsTemplate() {
        const input = document.getElementById('messageInput');
        if (!input || !input.value.trim()) return;
        saveTemplate(input.value.trim());
        input.value = '';
        input.focus();
      }

      function deleteTemplate(id) {
        let templates = JSON.parse(localStorage.getItem('chat-templates') || '[]');
        templates = templates.filter(t => t.id !== id);
        localStorage.setItem('chat-templates', JSON.stringify(templates));
        renderTemplates();
      }

      function insertTemplate(text) {
        const input = document.getElementById('messageInput');
        if (input) { input.value = text; input.focus(); input.dispatchEvent(new Event('input')); }
        const panel = document.querySelector('.template-panel');
        if (panel) panel.remove();
      }

      function renderTemplates() {
        let panel = document.querySelector('.template-panel');
        if (!panel) {
          panel = document.createElement('div');
          panel.className = 'template-panel';
          document.body.appendChild(panel);
        }
        const templates = JSON.parse(localStorage.getItem('chat-templates') || '[]');
        if (!templates.length) { panel.style.display = 'none'; return; }
        panel.style.display = 'block';
        panel.innerHTML = '<div class="template-panel-header"><span>📋 Maler</span><button class="template-close" data-close-templates="1">✕</button></div>'
          + templates.map(t => '<div class="template-item" data-insert-template="' + escapeHtml(t.text).replace(/"/g, '&quot;') + '"><span class="template-text">' + escapeHtml(t.text.substring(0, 60)) + '</span><button class="template-del" data-delete-template="' + t.id + '">✕</button></div>').join('');
        panel.querySelector('[data-close-templates]')?.addEventListener('click', () => { panel.style.display = 'none'; });
        panel.querySelectorAll('[data-insert-template]').forEach(item => {
          item.addEventListener('click', (e) => {
            if (e.target.closest('[data-delete-template]')) return;
            insertTemplate(item.dataset.insertTemplate);
          });
        });
        panel.querySelectorAll('[data-delete-template]').forEach(btn => {
          btn.addEventListener('click', (e) => { e.stopPropagation(); deleteTemplate(btn.dataset.deleteTemplate); });
        });
      }

      function toggleTemplates() {
        let panel = document.querySelector('.template-panel');
        if (panel && panel.style.display !== 'none') { panel.style.display = 'none'; return; }
        renderTemplates();
        panel = document.querySelector('.template-panel');
        if (panel) panel.style.display = 'block';
      }

      document.getElementById('templateBtn')?.addEventListener('click', toggleTemplates);

      // ── AI smart-reply forslag ──
      function lastIncomingText() {
        const msgs = messagesBox.querySelectorAll('.msg:not(.sent) .msg-text');
        if (!msgs.length) return '';
        return (msgs[msgs.length - 1].textContent || '').trim();
      }

      async function toggleAiReplies() {
        let panel = document.querySelector('.ai-replies-panel');
        if (panel) { panel.remove(); return; }
        if (!activeChat) { toast('Velg en kontakt først', 'info'); return; }
        const text = lastIncomingText();
        if (!text) { toast('Ingen innkommende melding å svare på', 'info'); return; }
        panel = document.createElement('div');
        panel.className = 'ai-replies-panel';
        panel.innerHTML = '<span class="ai-replies-title">✨ Forslag</span><button class="ai-reply-chip" disabled>Laster…</button>';
        const composerEl = document.getElementById('composer');
        composerEl.parentElement.insertBefore(panel, composerEl);
        try {
          const data = await loadJSON('/ai/replies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
          panel.innerHTML = '<span class="ai-replies-title">✨ Forslag</span>';
          (data.replies || []).forEach(r => {
            const b = document.createElement('button');
            b.className = 'ai-reply-chip';
            b.textContent = r;
            b.addEventListener('click', () => {
              const input = document.getElementById('messageInput');
              input.value = r;
              input.focus();
              updateSendButton();
              panel.remove();
            });
            panel.appendChild(b);
          });
          if (!(data.replies || []).length) panel.remove();
        } catch (e) {
          panel.remove();
          toast('Kunne ikke hente forslag: ' + (e.message || ''));
        }
      }

      document.getElementById('aiRepliesBtn')?.addEventListener('click', toggleAiReplies);

      // ── Push notifications for incoming messages ──
      window.__onNewMessage = async (data) => {
        const message = data.message || {};
        const sender = data.sender || message.sender || '';
        if (sender && isBlockedUser(sender)) return;
        const override = getChatNotifOverride(sender, 'user');
        if (override !== 'never' && (override === 'always' || (document.hidden && Notification.permission === 'granted'))) {
          if (!isInQuietHours()) {
            const text = message.ciphertext || message.text || 'Melding';
            try { new Notification('CryptoChat', { body: sender + ': ' + text, icon: '/static/favicon.ico' }); } catch(e) {}
          }
        }
        if (activeChat) {
          const isRelevantUserChat = data.chatType === 'user' && (sender === activeChat.target || message.recipient === activeChat.target);
          const isRelevantGroupChat = data.chatType === 'group' && data.groupId === activeChat.target;
          if (isRelevantUserChat) {
            await loadChat(activeChat.target);
          } else if (isRelevantGroupChat) {
            await loadGroup(activeChat.target);
          }
        }
        renderUsers();
      };

      window.__onReminder = (data) => {
        const text = (data && data.text) || 'Påminnelse';
        toast('⏰ ' + text, 'info');
        try {
          if (Notification.permission === 'granted') new Notification('⏰ Påminnelse', { body: text, icon: '/static/favicon.ico' });
        } catch (e) {}
        try { playNotificationSound(); } catch (e) {}
      };

      window.__onDigest = (data) => {
        const summary = (data && data.summary) || '';
        const title = (data && data.title) || 'Dagsoppsummering';
        if (!summary) return;
        toast('📊 ' + title, 'info');
        try {
          if (Notification.permission === 'granted') new Notification('📊 ' + title, { body: summary.substring(0, 140), icon: '/static/favicon.ico' });
        } catch (e) {}
        let panel = document.querySelector('.digest-panel');
        if (panel) panel.remove();
        panel = document.createElement('div');
        panel.className = 'digest-panel';
        panel.innerHTML = '<div class="digest-head"><span>📊 ' + escapeHtml(title) + '</span><button class="digest-close">✕</button></div><div class="digest-body">' + escapeHtml(summary).replace(/\n/g, '<br>') + '</div>';
        document.body.appendChild(panel);
        panel.querySelector('.digest-close').addEventListener('click', () => panel.remove());
        setTimeout(() => { if (panel.isConnected) panel.remove(); }, 60000);
      };

      window.__onBroadcast = (data) => {
        const text = (data && data.text) || '';
        if (!text) return;
        toast('📢 ' + text, 'info');
        try {
          if (Notification.permission === 'granted') new Notification('📢 Kunngjøring', { body: text.substring(0, 140), icon: '/static/favicon.ico' });
        } catch (e) {}
        try { playNotificationSound(); } catch (e) {}
      };

      async function openRemindersPanel() {
        let panel = document.querySelector('.reminders-panel');
        if (panel) { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; return; }
        panel = document.createElement('div');
        panel.className = 'reminders-panel';
        panel.innerHTML = '<div class="reminders-panel-head"><span>⏰ Påminnelser</span><button class="reminders-close">✕</button></div><div class="reminders-list">Laster…</div>';
        document.body.appendChild(panel);
        panel.querySelector('.reminders-close').addEventListener('click', () => panel.remove());
        try {
          const data = await loadJSON('/reminders');
          const list = panel.querySelector('.reminders-list');
          if (!(data.reminders || []).length) {
            list.innerHTML = '<div class="reminders-empty">Ingen påminnelser.<br>Høyreklikk en melding → Påminn meg.</div>';
            return;
          }
          list.innerHTML = '';
          data.reminders.forEach(r => {
            const row = document.createElement('div');
            row.className = 'reminder-row';
            row.innerHTML = '<div class="reminder-text">' + escapeHtml(r.text) + '</div><div class="reminder-when">' + escapeHtml(formatTime(r.remind_at)) + '</div><button class="reminder-del" title="Fjern">✕</button>';
            row.querySelector('.reminder-del').addEventListener('click', async () => {
              try {
                await loadJSON('/reminders/' + encodeURIComponent(r.id), { method: 'DELETE' });
                row.remove();
                toast('Påminnelse fjernet', 'success');
              } catch (e) { toast('Kunne ikke fjerne påminnelsen'); }
            });
            list.appendChild(row);
          });
        } catch (e) {
          panel.querySelector('.reminders-list').innerHTML = '<div class="reminders-empty">Kunne ikke laste påminnelser.</div>';
        }
      }

      document.getElementById('remindersBtn')?.addEventListener('click', openRemindersPanel);

      const onlineBadge = document.getElementById('onlineStatus');
      window.addEventListener('online', () => {        document.body.classList.remove('offline');
        if (onlineBadge) { onlineBadge.textContent = '● Online'; onlineBadge.style.color = '#4ade80'; }
        toast('Tilkobling gjenopprettet', 'success');
      });
      window.addEventListener('offline', () => {
        document.body.classList.add('offline');
        if (onlineBadge) { onlineBadge.textContent = '● Offline'; onlineBadge.style.color = '#ff6b6b'; }
        toast('Ingen internettilkobling — noen funksjoner er utilgjengelige');
      });
      if (!navigator.onLine) {
        document.body.classList.add('offline');
        if (onlineBadge) { onlineBadge.textContent = '● Offline'; onlineBadge.style.color = '#ff6b6b'; }
      }
    } catch (e) {
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.innerHTML = '<pre style="color:#ff8888;background:#0f1424;padding:16px;">' + escapeHtml(e.stack || e.message) + '</pre>';
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  setTimeout(() => {
    const ls = document.querySelector('.loading-screen');
    if (ls && ls.parentElement) {
      const app = document.getElementById('app');
      if (app && app.querySelector('.loading-screen')) {
        app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;color:#6d8094;"><div style="font-size:2rem;">⚠️</div><div style="font-weight:600;color:#e7e8f3;">Kunne ikke laste chat</div><div style="font-size:.85rem;">Prøv å oppdatere siden.</div><button id="appReloadBtn" style="margin-top:8px;padding:8px 20px;border:none;border-radius:8px;background:#5b8def;color:#fff;cursor:pointer;font-size:.9rem;">Last inn på nytt</button></div>';
        app.querySelector('#appReloadBtn')?.addEventListener('click', () => location.reload());
      }
    }
  }, 12000);

  // ── Thread panel ──
  function openThread(msgId) {
    closeThread();
    const panel = document.createElement('div');
    panel.className = 'thread-panel';
    const me = window.__APP__?.username || '';
    panel.innerHTML = '<div class="thread-panel-header"><button class="close-thread" data-close-thread="1">✕</button><span class="thread-title">Tråd</span></div><div class="thread-messages"><div class="spinner" style="margin:20px auto;"></div></div><div class="thread-composer"><input id="threadInput" placeholder="Svar i tråden..." /><button id="threadSendBtn">Send</button></div>';
    document.body.appendChild(panel);
    panel.querySelector('[data-close-thread]')?.addEventListener('click', () => closeThread());
    window.__threadMsgId = msgId;
    window.addEventListener('click', _closeThreadOutside, true);
    loadJSON('/thread/' + encodeURIComponent(msgId)).then(data => {
      const container = panel.querySelector('.thread-messages');
      container.innerHTML = '';
      if (data.parent) {
        const parentDiv = document.createElement('div');
        parentDiv.className = 'thread-parent-msg';
        parentDiv.innerHTML = '<div class="sender">' + escapeHtml(data.parent.sender) + '</div><div>' + escapeHtml((data.parent.text || '').substring(0, 120)) + '</div>';
        container.appendChild(parentDiv);
      }
      (data.thread || []).forEach(m => {
        const div = document.createElement('div');
        div.className = 'thread-msg';
        div.innerHTML = '<div class="sender">' + escapeHtml(m.sender) + '</div><div class="msg-text">' + escapeHtml((m.text || '').substring(0, 200)) + '</div><div class="time" style="font-size:.65rem;color:#6d8094;">' + formatTime(m.timestamp) + '</div>';
        container.appendChild(div);
      });
      if (!data.thread || !data.thread.length) {
        container.innerHTML += '<div style="text-align:center;padding:30px;color:#6d8094;font-size:.85rem;">Ingen svar i denne tråden ennå. Skriv et svar!</div>';
      }
    }).catch(() => {
      panel.querySelector('.thread-messages').innerHTML = '<div style="text-align:center;padding:20px;color:#6d8094;">Kunne ikke laste tråd</div>';
    });
    document.getElementById('threadSendBtn')?.addEventListener('click', sendThreadReply);
    document.getElementById('threadInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendThreadReply();
    });
    setTimeout(() => document.getElementById('threadInput')?.focus(), 100);
  }

  function _closeThreadOutside(e) {
    const panel = document.querySelector('.thread-panel');
    if (panel && !panel.contains(e.target) && !e.target.closest('.thread-link')) {
      closeThread();
    }
  }

  function closeThread() {
    const panel = document.querySelector('.thread-panel');
    if (panel) panel.remove();
    window.__threadMsgId = null;
    window.removeEventListener('click', _closeThreadOutside, true);
  }

  async function sendThreadReply() {
    const input = document.getElementById('threadInput');
    const msgId = window.__threadMsgId;
    if (!input || !msgId || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';
    const isGroup = activeChat?.type === 'group';
    try {
      if (isGroup) {
        const body = { text, reply_to: msgId };
        if (activeChat.groupE2EEKey) body.encryption = 'e2ee';
        await fetch('/groups/' + encodeURIComponent(activeChat.target) + '/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, recipient: activeChat.target, reply_to: msgId }) });
      }
      openThread(msgId);
    } catch (e) {
      toast('Kunne ikke sende svar');
    }
  }

  // Add thread link to messages
  (function patchThreadLink() {
    function tryPatch() {
      if (typeof finishAppend !== 'function') {
        setTimeout(tryPatch, 50);
        return;
      }
      const _origFinishAppend5 = finishAppend;
      finishAppend = function(message, chatId, isMe, renderedText, parent) {
        _origFinishAppend5(message, chatId, isMe, renderedText, parent);
        const box = parent || messagesBox;
        if (message.deleted) return;
        const items = box.querySelectorAll(':scope > .msg:not(.thread-link-added)');
        items.forEach(item => {
          if (item.dataset.msgId) {
            item.classList.add('thread-link-added');
            const link = document.createElement('span');
            link.className = 'thread-link';
            link.textContent = '↪ Tråd';
            link.onclick = (e) => { e.stopPropagation(); openThread(item.dataset.msgId); };
            const lastChild = item.querySelector('.reactions, .time-wrap, .msg-actions');
            if (lastChild) lastChild.after(link);
            else item.appendChild(link);
          }
        });
      };
    }
    tryPatch();
  })();
})();
