/**
 * Onboarding flow — Akademija Sajber Čuvara (uvod)
 * Tok: Strip (4 panela) → Dijalog (upoznaj Bajta) → Avatar (3 koraka)
 *      → Odluka (tutorial) → Dijalog (poziv) → Nagrada → Mapa
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, StyleSheet, Image, ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { T } from "../lib/theme";
import { useAuth } from "../contexts/auth-context";
import { apiUpdateAvatar } from "../lib/api";
import VectorBajt from "../components/Bajt";
import GuardianAvatar from "../components/GuardianAvatar";
import PushPermissionPrompt from "../components/PushPermissionPrompt";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "strip" | "dlg_meet" | "avatar" | "choice" | "dlg_call" | "push" | "reward";
type AvStep = "appearance" | "specialty";
type Emo = "happy" | "neutral" | "wink" | "alarm" | "determined";

interface AvatarState {
  body: string;
  color: { id: string; hex: string };
  specialty: string | null;
}

// ── Scene images ──────────────────────────────────────────────────────────────

let IMG_CORRIDOR: number | null = null;
let IMG_LAIR:     number | null = null;
let IMG_MRACKO:   number | null = null;
let IMG_LOGIN:    number | null = null;
let IMG_WELCOME:  number | null = null;
let IMG_FAKE_POPUP: number | null = null;
let IMG_BADGE_RECRUIT: number | null = null;
try { IMG_CORRIDOR = require("../assets/images/bg_corridor.jpg"); } catch { IMG_CORRIDOR = null; }
try { IMG_LAIR     = require("../assets/images/bg_lair.jpg");     } catch { IMG_LAIR     = null; }
try { IMG_MRACKO   = require("../assets/images/bg_mracko.jpg");   } catch { IMG_MRACKO   = null; }
try { IMG_LOGIN    = require("../assets/images/bg_login.jpg");    } catch { IMG_LOGIN    = null; }
try { IMG_WELCOME  = require("../assets/images/bg_onboarding_welcome.jpg"); } catch { IMG_WELCOME = null; }
try { IMG_FAKE_POPUP = require("../assets/images/prop_fake_popup.png"); } catch { IMG_FAKE_POPUP = null; }
try { IMG_BADGE_RECRUIT = require("../assets/images/badge_recruit.png"); } catch { IMG_BADGE_RECRUIT = null; }

// ── Static data ───────────────────────────────────────────────────────────────

const STRIP_PANELS = [
  { caption: "Ovo je Mreža — svijet u kojem žive svi naši podaci, poruke i nalozi." },
  { caption: "Donedavno je bila bezbjedna. A onda su počele da nestaju lozinke, cure podaci, kvare se nalozi..." },
  { caption: "Iza svega stoji neko. Zovu ga Mračko. Niko ga nije vidio — ali svi osjećaju štetu." },
  { caption: "Zato postoji Akademija Sajber Čuvara. A danas — primaju novog regruta. Tebe." },
];

const STRIP_IMAGES = [IMG_CORRIDOR, IMG_LAIR, IMG_MRACKO, IMG_LOGIN] as const;

const DLG_MEET = [
  { emo: "happy"     as Emo, text: "Hej, hej! Budan si! Dobrodošao u Akademiju Sajber Čuvara. Ja sam Bajt — tvoj pratilac, savjetnik i, ako budem dobar, omiljeni bot." },
  { emo: "neutral"   as Emo, text: "Ukratko: Mreža je u problemu, a ti si tu da pomogneš da je očuvamo. Ne brini, ne moraš ništa znati unaprijed — zato sam tu ja." },
  { emo: "wink"      as Emo, text: "Prvo pravilo čuvara: ne moraš biti najpametniji u sobi, samo malo oprezniji od onoga ko pokušava da te prevari. Hajde da te prvo malo doteramo." },
];

const DLG_CALL = [
  { emo: "alarm"     as Emo, text: "Eeee, nije sad vrijeme za pauzu — alarm! Mračkova ekipa udara na Luku Lozinki, prvu kapiju Mreže." },
  { emo: "determined"as Emo, text: "Tamo ljudi čuvaju svoje naloge, a napadač pokušava da ih provali. Tvoj prvi pravi zadatak, čuvaru {ime}: idemo tamo i pokažemo im kako se prave lozinke koje se ne daju tako lako. Spreman?" },
];

const AVATAR_BODIES = [
  { id: "cuvar_a", key: "A", label: "Scout" },
  { id: "cuvar_b", key: "B", label: "Defender" },
  { id: "cuvar_c", key: "C", label: "Tech" },
  { id: "cuvar_d", key: "D", label: "Signal" },
];
const AVATAR_COLORS = [
  { id: "plava",       hex: "#3E9BE8" },
  { id: "tirkizna",    hex: "#2BB7A0" },
  { id: "narandžasta", hex: "#F0997B" },
  { id: "ljubičasta",  hex: "#9B7BE0" },
  { id: "zelena",      hex: "#5DBE7E" },
];
const SPECIALTIES = [
  { id: "tragac",    name: "Tragač",    icon: "🔍", desc: "Voli da kopa, primjećuje sitnice koje drugi promaše." },
  { id: "branitelj", name: "Branitelj", icon: "🛡️", desc: "Diže zidove i štiti sisteme prije nego što napad krene." },
  { id: "tehnicar",  name: "Tehničar",  icon: "⚙️", desc: "Voli da otvori sve i vidi kako radi iznutra, pa to popravi." },
];
const BAJT_REACT: Record<string, string> = {
  tragac:    "Detektivski tip, ha? Mračko te neće voljeti.",
  branitelj: "Zidar Mreže. Solidno.",
  tehnicar:  "Aha, jedan od onih što rastave pa sastave! Volim te već.",
};

const CHOICE_OPTIONS = [
  { id: "a", text: "Kliknem odmah, ko bi propustio 10.000 €!", correct: false, bajt: "Auu! Da je bilo stvarno, sad bi neko imao tvoje podatke. Pravilo: predobro da bi bilo istinito + žuri te + traži klik = mamac. Pravi pokloni te ne jure sa tajmerom. Probaj opet, sad znaš." },
  { id: "b", text: "Ignorišem. Niko mi ne dijeli 10.000 € bez razloga.", correct: true,  bajt: "Tačno tako! Hitnja i 'predobra ponuda' su klasičan trik. Upravo si odbio svoj prvi mamac. Vidiš da nije teško — samo treba stati i pomisliti sekundu prije klika." },
];

// ── Typewriter ────────────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 18) {
  const [n, setN] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setN(0);
    if (ref.current) clearInterval(ref.current);
    let i = 0;
    ref.current = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length && ref.current) clearInterval(ref.current);
    }, speed);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [text, speed]);

  return {
    shown: text.slice(0, n),
    done: n >= text.length,
    skip: () => { if (ref.current) clearInterval(ref.current); setN(text.length); },
  };
}

function renderWithName(text: string, name: string): React.ReactNode {
  const parts = text.split("{ime}");
  return parts.map((p, i) => (
    <Text key={i}>
      {p}
      {i < parts.length - 1 && <Text style={{ color: T.tealDeep, fontFamily: T.fontBodyXBold }}>{name || "čuvaru"}</Text>}
    </Text>
  ));
}

// ── Sub-screens ───────────────────────────────────────────────────────────────

function StripScreen({ panel, total, onNext, onPrev, onSkip }: {
  panel: number; total: number; onNext: () => void; onPrev: () => void; onSkip: () => void;
}) {
  const p = STRIP_PANELS[panel];
  const last = panel === total - 1;
  return (
    <View style={s.flex}>
      {/* HUD */}
      <View style={s.hud}>
        <View style={s.hudLeft}>
          <Text style={s.hudLabel}>Panel {panel + 1} / {total}</Text>
        </View>
        <TouchableOpacity onPress={onSkip} style={s.skipBtn}>
          <Text style={s.skipTxt}>Preskoči uvod ›</Text>
        </TouchableOpacity>
      </View>

      {/* Art panel */}
      {STRIP_IMAGES[panel] ? (
        <ImageBackground
          source={STRIP_IMAGES[panel] as number}
          style={s.panelArt}
          imageStyle={{ borderRadius: T.rMd }}
          resizeMode="cover"
        >
          <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(5,10,22,0.32)", borderRadius: T.rMd }} />
        </ImageBackground>
      ) : (
        <View style={[s.panelArt, { borderStyle: "dashed" }]}>
          <Text style={s.panelArtTag}>STRIP PANEL {panel + 1}</Text>
        </View>
      )}

      {/* Caption */}
      <View style={s.caption}>
        <Text style={s.captionText}>{p.caption}</Text>
      </View>

      {/* Nav */}
      <View style={s.stripNav}>
        <TouchableOpacity
          onPress={onPrev} disabled={panel === 0}
          style={[s.roundBtn, panel === 0 && { opacity: 0.3 }]}
        >
          <Text style={s.roundBtnTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.dots}>
          {STRIP_PANELS.map((_, i) => (
            <View key={i} style={[s.dot, i === panel && s.dotActive]} />
          ))}
        </View>
        {last ? (
          <TouchableOpacity onPress={onNext} style={s.btnPrimary}>
            <Text style={s.btnPrimaryTxt}>Dalje ›</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onNext} style={s.roundBtn}>
            <Text style={s.roundBtnTxt}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function DialogueScreen({ lines, line, onNext, onSkip, avatarName, nextLabel, bgImage }: {
  lines: typeof DLG_MEET; line: number; onNext: () => void; onSkip: () => void;
  avatarName: string; nextLabel: string; bgImage?: number | null;
}) {
  const cur = lines[line];
  const tw = useTypewriter(cur.text);
  const last = line === lines.length - 1;

  return (
    <View style={s.flex}>
      <View style={s.hud}>
        <View style={s.hudLeft} />
        <TouchableOpacity onPress={onSkip} style={s.skipBtn}>
          <Text style={s.skipTxt}>Preskoči ›</Text>
        </TouchableOpacity>
      </View>

      {/* Bajt centered with optional scene background */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {bgImage ? (
          <Image source={bgImage} style={{ position: "absolute", width: "100%", height: "100%", resizeMode: "cover", opacity: 0.25 }} />
        ) : null}
        <VectorBajt emo={cur.emo} size={140} />
      </View>

      {/* Dialog box */}
      <View style={s.dlgWrap}>
        <View style={s.nametag}>
          <View style={s.nametagDot} />
          <Text style={s.nametagTxt}>Bajt</Text>
        </View>
        <TouchableOpacity activeOpacity={1} onPress={tw.skip} style={s.dlgBox}>
          <Text style={s.dlgText}>
            {renderWithName(tw.shown, avatarName)}
            {!tw.done && <Text style={{ color: T.tealDeep }}>|</Text>}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <View style={{ flexDirection: "row", gap: 5 }}>
              {lines.map((_, i) => (
                <View key={i} style={[s.dot, { backgroundColor: T.paperLine }, i === line && { backgroundColor: T.teal, width: 18, borderRadius: 4 }]} />
              ))}
            </View>
            <TouchableOpacity onPress={onNext} style={s.btnPrimary}>
              <Text style={s.btnPrimaryTxt}>{last ? nextLabel : "Dalje ›"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AvatarScreen({ av, setAv, step, onBack, onFwd, knowledge }: {
  av: AvatarState; setAv: (a: AvatarState) => void;
  step: AvStep; onBack: () => void; onFwd: () => void; knowledge: number;
}) {
  const stepIdx = { appearance: 0, specialty: 1 }[step];
  const canFwd  = step === "appearance" || (step === "specialty" && !!av.specialty);
  const selectedBody = AVATAR_BODIES.find((b) => b.id === av.body) ?? AVATAR_BODIES[0];

  return (
    <View style={s.flex}>
      {/* Steps indicator */}
      <View style={s.hud}>
        {(["Izgled", "Specijalnost"] as const).map((l, i) => (
          <View key={l} style={[s.avStep, i === stepIdx && s.avStepOn, i < stepIdx && s.avStepDone]}>
            <View style={[s.avStepN, i === stepIdx && s.avStepNOn, i < stepIdx && s.avStepNDone]}>
              <Text style={{ fontFamily: T.fontBodyXBold, fontSize: 10, color: i < stepIdx ? "#fff" : i === stepIdx ? T.bg : T.hudMuted }}>
                {i < stepIdx ? "✓" : String(i + 1)}
              </Text>
            </View>
            <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: i === stepIdx ? T.bg : i < stepIdx ? T.mint : T.hudMuted }}>{l}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Guide bubble */}
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 8 }}>
          <VectorBajt emo={step === "appearance" ? "happy" : step === "specialty" ? "neutral" : "happy"} size={58} />
          <View style={s.guideBubble}>
            <Text style={s.guideTxt}>
              {step === "appearance" && "Svaki čuvar izgleda drugačije. Kako ćeš ti? Biraj slobodno — uvijek možeš promijeniti."}
              {step === "specialty" && "Odlično! Sad, koja ti je specijalnost? To je samo tvoj stil — svi čuvari rade sve. Ime već imamo iz prijave."}
            </Text>
          </View>
        </View>

        {/* Preview */}
        <View style={{ alignItems: "center" }}>
          <View style={{ borderWidth: 2.5, borderColor: av.color.hex, borderRadius: 22, padding: 8, shadowColor: av.color.hex, shadowRadius: 12, shadowOpacity: 0.4 }}>
            <View style={s.avPreviewPh}>
              <GuardianAvatar base={selectedBody.key} color={av.color.hex} gear={av.specialty} size={128} />
              <View style={{ position: "absolute", right: 6, bottom: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: av.color.hex, borderWidth: 2, borderColor: T.paper }} />
            </View>
          </View>
        </View>

        {step === "appearance" && (
          <>
            <Text style={s.avLabel}>Tijelo / lik</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {AVATAR_BODIES.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setAv({ ...av, body: b.id })}
                  style={[s.avBodyBtn, av.body === b.id && { borderColor: T.teal, shadowColor: T.teal, shadowRadius: 6, shadowOpacity: 0.4 }]}
                >
                  <View style={[s.avBodyPh, { borderColor: av.body === b.id ? T.teal : "transparent", borderWidth: 2 }]}>
                    <GuardianAvatar base={b.key} color={av.body === b.id ? av.color.hex : "#7DD3FC"} gear={av.specialty} size={56} />
                  </View>
                  <Text style={{ fontFamily: T.fontBody, fontSize: 9, color: T.hudMuted, marginTop: 3 }}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.avLabel}>Boja opreme</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setAv({ ...av, color: c })}
                  style={[s.avSwatch, { backgroundColor: c.hex, borderColor: av.color.id === c.id ? "#fff" : "rgba(255,255,255,0.2)" }]}
                >
                  {av.color.id === c.id && <Text style={{ color: "#fff", fontFamily: T.fontBodyXBold }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === "specialty" && (
          <>
            <View style={{ gap: 10 }}>
              {SPECIALTIES.map((sp) => (
                <TouchableOpacity
                  key={sp.id}
                  onPress={() => setAv({ ...av, specialty: sp.id })}
                  style={[s.optionCard, av.specialty === sp.id && { borderColor: T.teal, shadowColor: T.teal, shadowRadius: 6, shadowOpacity: 0.3 }]}
                >
                  <View style={s.optKey}>
                    <Text style={{ fontSize: 18 }}>{sp.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.optTitle}>{sp.name}</Text>
                    <Text style={s.optDesc}>{sp.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {av.specialty && (
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: T.primarySoft, borderRadius: T.rMd, padding: 12 }}>
                <VectorBajt emo="wink" size={40} />
                <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 13.5, flex: 1 }}>{BAJT_REACT[av.specialty]}</Text>
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* Footer buttons */}
      <View style={s.avFoot}>
        <TouchableOpacity onPress={onBack} style={[s.btnSecondary, { minWidth: 52 }]}>
          <Text style={s.btnSecondaryTxt}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onFwd}
          disabled={!canFwd}
          style={[s.btnPrimary, { flex: 1, opacity: canFwd ? 1 : 0.4 }]}
        >
          <Text style={s.btnPrimaryTxt}>{step === "specialty" ? "Spremi i nastavi ›" : "Dalje ›"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChoiceScreen({ onNext, avatarName }: { onNext: () => void; avatarName: string }) {
  const [pick, setPick]     = useState<string | null>(null);
  const zapAnim             = useRef(new Animated.Value(0)).current;
  const chosen              = pick ? CHOICE_OPTIONS.find((o) => o.id === pick) : null;
  const correct             = chosen?.correct ?? false;

  function choose(id: string) {
    const opt = CHOICE_OPTIONS.find((o) => o.id === id)!;
    if (!opt.correct) {
      // zap animation
      Animated.sequence([
        Animated.timing(zapAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(zapAnim, { toValue:  6, duration: 60, useNativeDriver: true }),
        Animated.timing(zapAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(zapAnim, { toValue:  4, duration: 60, useNativeDriver: true }),
        Animated.timing(zapAnim, { toValue:  0, duration: 60, useNativeDriver: true }),
      ]).start(() => setPick(id));
    } else {
      setPick(id);
    }
  }

  return (
    <View style={s.flex}>
      <View style={s.hud}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <VectorBajt emo={pick ? (correct ? "happy" : "alarm") : "neutral"} size={46} />
          <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 13, flex: 1 }}>
            Ovo je simulacija — ništa stvarno, samo vježba. Iskoči ti ovakva poruka na ekranu. Šta radiš?
          </Text>
        </View>
      </View>

      {/* Fake popup prop */}
      {!pick ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Animated.View style={{ transform: [{ translateX: zapAnim }], width: "100%", alignItems: "center" }}>
            {IMG_FAKE_POPUP ? (
              <Image source={IMG_FAKE_POPUP} style={{ width: "100%", maxWidth: 330, aspectRatio: 451 / 382, resizeMode: "contain" }} />
            ) : (
              <View style={s.scam}>
                <View style={s.scamBadge}><Text style={s.scamBadgeTxt}>🎁 SPECIJALNA PONUDA</Text></View>
                <Text style={s.scamTitle}>ČESTITAMO!</Text>
                <Text style={s.scamBody}>Izabran si za nagradu od 10.000 €! Klikni OVDJE odmah da preuzmeš!!</Text>
                <Text style={s.scamTimer}>⏰ Ponuda ističe za <Text style={{ fontVariant: ["tabular-nums"] }}>02:59</Text></Text>
                <View style={s.scamCta}><Text style={s.scamCtaTxt}>KLIKNI OVDJE →</Text></View>
              </View>
            )}
          </Animated.View>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ borderRadius: T.rPill, borderWidth: 1, borderColor: T.border, borderStyle: "dashed", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: T.hudBg }}>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13 }}>✓ lažna poruka — {correct ? "ignorisana" : "rasplinjela se"}</Text>
          </View>
        </View>
      )}

      {/* Options */}
      <View style={s.choiceFoot}>
        {!pick && (
          <View style={{ gap: 10 }}>
            {CHOICE_OPTIONS.map((o) => (
              <TouchableOpacity key={o.id} onPress={() => choose(o.id)} style={s.optionCard}>
                <View style={s.optKey}>
                  <Text style={{ fontFamily: T.fontBodyXBold, fontSize: 14, color: T.primaryInk }}>{o.id.toUpperCase()}</Text>
                </View>
                <Text style={[s.optTitle, { flex: 1 }]}>{o.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pick && (
          <>
            <View style={{ gap: 10 }}>
              {CHOICE_OPTIONS.map((o) => (
                <View key={o.id} style={[s.optionCard,
                  o.id === pick && o.correct  && { borderColor: T.good,  backgroundColor: T.goodSoft },
                  o.id === pick && !o.correct && { borderColor: T.bad,   backgroundColor: T.badSoft },
                  o.id !== pick              && { opacity: 0.45 },
                ]}>
                  <View style={[s.optKey,
                    o.id === pick && o.correct  && { backgroundColor: T.good },
                    o.id === pick && !o.correct && { backgroundColor: T.bad },
                  ]}>
                    <Text style={{ fontFamily: T.fontBodyXBold, fontSize: 14, color: o.id === pick ? "#fff" : T.primaryInk }}>{o.id.toUpperCase()}</Text>
                  </View>
                  <Text style={[s.optTitle, { flex: 1, color: o.id === pick ? T.ink : T.ink }]}>{o.text}</Text>
                </View>
              ))}
            </View>

            <View style={[s.feedback, correct ? s.feedbackGood : s.feedbackBad]}>
              <View style={[s.feedIcon, { backgroundColor: correct ? T.good : T.bad }]}>
                <Text style={{ color: "#fff", fontFamily: T.fontBodyXBold, fontSize: 14 }}>{correct ? "✓" : "!"}</Text>
              </View>
              <Text style={{ fontFamily: T.fontBody, fontSize: 14, color: correct ? T.goodInk : T.badInk, flex: 1, lineHeight: 20 }}>{chosen?.bajt}</Text>
            </View>

            {correct ? (
              <>
                <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13, fontStyle: "italic", lineHeight: 18 }}>
                  I to je cijela tajna ove igre: ne učiš napamet, nego vježbaš da prepoznaš i odlučiš. Sad si spreman za pravi zadatak.
                </Text>
                <TouchableOpacity onPress={onNext} style={s.btnPrimary}>
                  <Text style={s.btnPrimaryTxt}>Spreman sam ›</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setPick(null)} style={s.btnSecondary}>
                <Text style={s.btnSecondaryTxt}>↺ Probaj ponovo</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function RewardScreen({ avatarName, onClaim }: { avatarName: string; onClaim: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const rotAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start();
    Animated.loop(Animated.timing(rotAnim, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [scaleAnim, rotAnim]);

  const spin = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={s.flex}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 24, paddingBottom: 16 }}>
        {/* Rotating rays */}
        <View style={{ width: 280, height: 280, alignItems: "center", justifyContent: "center", marginTop: 16 }}>
          <Animated.View style={{ position: "absolute", width: 280, height: 280, transform: [{ rotate: spin }] }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={{
                position: "absolute", width: 2, height: 80,
                backgroundColor: `${T.sun}30`,
                top: 140 - 80, left: 139,
                transformOrigin: "bottom center",
                transform: [{ rotate: `${i * 30}deg` }, { translateY: -40 }],
              }} />
            ))}
          </Animated.View>

          {/* Badge */}
          <Animated.View style={[s.badge, { transform: [{ scale: scaleAnim }] }]}>
            {IMG_BADGE_RECRUIT ? (
              <Image source={IMG_BADGE_RECRUIT} style={{ width: 104, height: 104, resizeMode: "contain" }} />
            ) : (
              <View style={s.badgeInner}>
                <Text style={s.badgeGlyph}>REGRUT{"\n"}AKADEMIJE</Text>
              </View>
            )}
          </Animated.View>
        </View>

        <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>NAPREDOVAO SI</Text>
        <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 22, marginBottom: 4 }}>Bedž: Regrut Akademije</Text>
        <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14, marginBottom: 20 }}>
          Zvanično si čuvar{avatarName ? `, ${avatarName}` : ""}!
        </Text>

        {/* Reward items */}
        <View style={{ width: "100%", gap: 10, marginBottom: 16 }}>
          {[
            { icon: "🏅", image: IMG_BADGE_RECRUIT, title: "Bedž regruta",   sub: "Nova značka u profilu" },
            { icon: "🧣", title: "Startni plašt",   sub: "Kozmetika za avatara" },
            { icon: "📈", title: "+10% Znanje",      sub: "Traka znanja: 0% → 10%" },
          ].map((item) => (
            <View key={item.title} style={s.rewardItem}>
              <View style={s.rewardIcon}>
                {"image" in item && item.image ? (
                  <Image source={item.image} style={{ width: 34, height: 34, resizeMode: "contain" }} />
                ) : (
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                )}
              </View>
              <View>
                <Text style={{ fontFamily: T.fontBodyXBold, color: T.hudInk, fontSize: 14.5 }}>{item.title}</Text>
                <Text style={{ fontFamily: T.fontBody,      color: T.hudMuted, fontSize: 12 }}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bajt outro */}
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: T.primarySoft, borderRadius: T.rMd, padding: 12, width: "100%", marginBottom: 4 }}>
          <VectorBajt emo="determined" size={44} />
          <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 13.5, flex: 1 }}>
            Mapa ti je otključala <Text style={{ color: T.mint, fontFamily: T.fontBodyXBold }}>Luku Lozinki</Text> — vidimo se tamo!
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity onPress={onClaim} style={s.btnPrimary}>
          <Text style={s.btnPrimaryTxt}>Kreni na Luku Lozinki ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Root Onboarding screen ────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [step,      setStep]     = useState<Step>("strip");
  const [panel,     setPanel]    = useState(0);
  const [dlgLine,   setDlgLine]  = useState(0);
  const [avStep,    setAvStep]   = useState<AvStep>("appearance");
  const [av, setAv] = useState<AvatarState>({
    body: "cuvar_a", color: AVATAR_COLORS[0], specialty: null,
  });
  const agentName = user?.codename?.trim() || user?.username || "";

  async function finish() {
    const avatarBase = av.body.replace("cuvar_", "").toUpperCase();
    await AsyncStorage.setItem("onboardingDone", "true");
    try {
      const saved = await apiUpdateAvatar({
        avatarBase,
        avatarColor: av.color.hex,
        avatarGear: av.specialty ?? "none",
        onboardingDone: true,
      });
      if (user) {
        await updateUser({
          ...user,
          codename: saved.codename,
          avatarBase: saved.avatarBase,
          avatarColor: saved.avatarColor,
          avatarGear: saved.avatarGear,
          onboardingDone: saved.onboardingDone,
        });
      }
    } catch {
      // Čak i ako server padne, ne tjeraj korisnika ponovo kroz uvod —
      // obilježi lokalno kao završeno i nastavi.
      if (user) {
        await updateUser({
          ...user,
          codename: user.codename,
          avatarBase,
          avatarColor: av.color.hex,
          avatarGear: av.specialty ?? "none",
          onboardingDone: true,
        });
      }
    }
    router.replace("/(tabs)");
  }

  function skipToAvatar() {
    setStep("avatar");
    setAvStep("appearance");
  }

  const lines = step === "dlg_call" ? DLG_CALL : DLG_MEET;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Shared scene gradient */}
      <LinearGradient
        colors={[T.scene1, T.scene2, T.bg]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {step === "strip" && (
        <StripScreen
          panel={panel} total={STRIP_PANELS.length}
          onNext={() => {
            if (panel < STRIP_PANELS.length - 1) setPanel(panel + 1);
            else { setStep("dlg_meet"); setDlgLine(0); }
          }}
          onPrev={() => setPanel(Math.max(0, panel - 1))}
          onSkip={skipToAvatar}
        />
      )}

      {step === "dlg_meet" && (
        <DialogueScreen
          lines={DLG_MEET} line={dlgLine} avatarName={agentName}
          onSkip={skipToAvatar}
          nextLabel="Hajde ›"
          bgImage={IMG_WELCOME}
          onNext={() => {
            if (dlgLine < DLG_MEET.length - 1) setDlgLine(dlgLine + 1);
            else { setStep("avatar"); setAvStep("appearance"); }
          }}
        />
      )}

      {step === "avatar" && (
        <AvatarScreen
          av={av} setAv={setAv} step={avStep} knowledge={0}
          onBack={() => {
            if (avStep === "appearance") { setStep("dlg_meet"); setDlgLine(DLG_MEET.length - 1); }
            else setAvStep("appearance");
          }}
          onFwd={() => {
            if (avStep === "appearance") setAvStep("specialty");
            else setStep("choice");
          }}
        />
      )}

      {step === "choice" && (
        <ChoiceScreen
          avatarName={agentName}
          onNext={() => { setStep("dlg_call"); setDlgLine(0); }}
        />
      )}

      {step === "dlg_call" && (
        <DialogueScreen
          lines={DLG_CALL} line={dlgLine} avatarName={agentName}
          onSkip={() => setStep("push")}
          nextLabel="Idemo ›"
          bgImage={IMG_MRACKO}
          onNext={() => {
            if (dlgLine < DLG_CALL.length - 1) setDlgLine(dlgLine + 1);
            else setStep("push");
          }}
        />
      )}

      {step === "push" && (
        <PushPermissionPrompt
          onDone={() => setStep("reward")}
          title="Da li želiš Bajtova obavještenja?"
          body="Luka Lozinki je otključana. Bajt može da te podsjeti na dnevni izazov, nastavak misije i korisne cyber savjete."
        />
      )}

      {step === "reward" && (
        <RewardScreen avatarName={agentName} onClaim={finish} />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1 },

  // HUD
  hud: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, paddingTop: 10, gap: 10 },
  hudLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  hudLabel: { fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12 },
  skipBtn: { backgroundColor: T.hudBg, borderWidth: 1, borderColor: T.hudStroke, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  skipTxt: { fontFamily: T.fontBody, color: T.hudMuted, fontSize: 12 },

  // Strip
  panelArt: {
    flex: 1, margin: 16, borderRadius: T.rMd, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  panelArtTag: { fontFamily: T.fontBody, fontSize: 10, color: T.bg, backgroundColor: T.sun, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  caption: {
    marginHorizontal: 16, backgroundColor: T.paper, borderRadius: T.rMd,
    borderWidth: 2, borderColor: T.paperLine, padding: 16,
  },
  captionText: { fontFamily: T.fontBody, color: T.ink, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  stripNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 18 },
  dots: { flexDirection: "row", gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.hudStroke },
  dotActive: { width: 22, borderRadius: 4, backgroundColor: T.teal },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.hudBg, borderWidth: 1, borderColor: T.hudStroke, alignItems: "center", justifyContent: "center" },
  roundBtnTxt: { fontFamily: T.fontBodyXBold, fontSize: 20, color: T.hudInk },

  // Buttons
  btnPrimary: {
    backgroundColor: T.tealDeep, borderRadius: 999, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
    borderBottomWidth: 4, borderBottomColor: "#08634A",
  },
  btnPrimaryTxt: { fontFamily: T.fontHead, fontSize: 17, color: "#fff" },
  btnSecondary: {
    backgroundColor: "transparent", borderRadius: 999, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: T.hudStroke,
  },
  btnSecondaryTxt: { fontFamily: T.fontBody, fontSize: 15, color: T.hudInk },

  // Dialogue
  dlgWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  nametag: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", marginLeft: 16, marginBottom: -12, zIndex: 2,
    backgroundColor: T.primary, borderRadius: T.rMd, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 18,
    borderWidth: 2.5, borderColor: T.primaryInk,
  },
  nametagDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.mint },
  nametagTxt: { fontFamily: T.fontHead, fontSize: 16, color: "#fff" },
  dlgBox: {
    backgroundColor: T.paper, borderRadius: T.rLg,
    borderWidth: 2.5, borderColor: T.paperLine, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
  },
  dlgText: { fontFamily: T.fontBody, color: T.ink, fontSize: 16.5, lineHeight: 24, minHeight: 48 },

  // Avatar
  avStep: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    backgroundColor: T.hudBg, borderWidth: 1, borderColor: T.hudStroke,
    borderRadius: 999, paddingVertical: 8,
  },
  avStepOn:   { backgroundColor: T.sun, borderColor: T.sun },
  avStepDone: { borderColor: `${T.mint}50` },
  avStepN:    { width: 18, height: 18, borderRadius: 9, backgroundColor: T.hudStroke, alignItems: "center", justifyContent: "center" },
  avStepNOn:  { backgroundColor: "rgba(0,0,0,0.18)" },
  avStepNDone:{ backgroundColor: T.teal },
  avLabel:    { fontFamily: T.fontBodyXBold, fontSize: 11, color: T.hudMuted, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  avBodyBtn:  { flex: 1, alignItems: "center", gap: 4, backgroundColor: T.panel, borderWidth: 1, borderColor: T.hudStroke, borderRadius: T.rSm, paddingVertical: 10 },
  avBodyPh:   { width: 58, height: 72, borderRadius: 10, backgroundColor: T.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avSwatch:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  avPreviewPh: {
    width: 140, height: 140, borderRadius: T.rMd,
    backgroundColor: "rgba(13,22,44,0.4)", borderWidth: 1, borderColor: T.hudStroke, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avPreviewTag: { fontFamily: T.fontBody, fontSize: 9, color: T.bg, backgroundColor: T.sun, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  avFoot: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 12 },

  // Choice
  choiceFoot: {
    backgroundColor: T.panelDeep, borderTopWidth: 1, borderTopColor: T.hudStroke,
    padding: 16, paddingBottom: 12, gap: 12,
  },
  scam: {
    width: "100%", maxWidth: 300,
    backgroundColor: "#FFF6E2", borderWidth: 3, borderColor: T.sun,
    borderRadius: 16, padding: 18, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.55, shadowRadius: 24, elevation: 16,
  },
  scamBadge: { backgroundColor: T.coral, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  scamBadgeTxt: { fontFamily: T.fontBodyXBold, color: "#fff", fontSize: 11, letterSpacing: 0.5 },
  scamTitle: { fontFamily: T.fontHead, color: "#C4471F", fontSize: 28, letterSpacing: 0.5, marginBottom: 6 },
  scamBody: { fontFamily: T.fontBody, color: "#3a2c10", fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 8 },
  scamTimer: { fontFamily: T.fontBody, color: "#9A3B27", fontSize: 12.5, marginBottom: 10 },
  scamCta: { width: "100%", backgroundColor: "#E2542A", borderRadius: 12, padding: 12, borderBottomWidth: 6, borderBottomColor: "#B23E1C", alignItems: "center" },
  scamCtaTxt: { fontFamily: T.fontHead, color: "#fff", fontSize: 17 },
  scamPin: { fontFamily: "monospace", fontSize: 10, color: T.hudMuted, marginTop: 12, opacity: 0.8 },

  // Options
  optionCard: {
    backgroundColor: T.paper, borderWidth: 2, borderColor: T.paperLine,
    borderRadius: T.rMd, padding: 16, flexDirection: "row", gap: 12, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  optKey: { width: 36, height: 36, borderRadius: 11, backgroundColor: T.primarySoft, alignItems: "center", justifyContent: "center" },
  optTitle: { fontFamily: T.fontBodyXBold, color: T.ink, fontSize: 14.5 },
  optDesc: { fontFamily: T.fontBody, color: T.inkSoft, fontSize: 13, marginTop: 2, lineHeight: 18 },

  // Feedback
  feedback: { borderRadius: T.rMd, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start", borderWidth: 2 },
  feedbackGood: { backgroundColor: T.goodSoft, borderColor: T.good },
  feedbackBad:  { backgroundColor: T.badSoft,  borderColor: T.bad  },
  feedIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  // Guide
  guideBubble: {
    flex: 1, backgroundColor: T.paper, borderRadius: 4,
    borderTopLeftRadius: T.rMd, borderTopRightRadius: T.rMd, borderBottomRightRadius: T.rMd,
    borderWidth: 2, borderColor: T.paperLine, padding: 12,
  },
  guideTxt: { fontFamily: T.fontBody, color: T.ink, fontSize: 14, lineHeight: 20 },

  // Reward / badge
  badge: {
    width: 132, height: 132, borderRadius: 40,
    backgroundColor: T.sun,
    borderWidth: 2.5, borderColor: "#C99340",
    alignItems: "center", justifyContent: "center",
    shadowColor: T.sun, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  badgeInner: { position: "absolute", inset: 12, borderRadius: 30, borderWidth: 2, borderColor: "rgba(120,80,20,0.35)", borderStyle: "dashed" },
  badgeGlyph: { fontFamily: T.fontHead, fontSize: 13, color: "#6B4A14", textAlign: "center", letterSpacing: 0.5, lineHeight: 18 },
  rewardItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: T.hudBg, borderWidth: 1, borderColor: T.hudStroke,
    borderRadius: T.rMd, padding: 12, width: "100%",
  },
  rewardIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: T.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.hudStroke },
});
