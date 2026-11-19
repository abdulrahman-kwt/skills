# البرومتات

هذي البرومتات اللي سوت شخصية حقيقية من أولها لين تكلمت. خلها بالإنجليزي، لأن الموديلات تفهمها أدق.

## الفراغات وشلون تعبيها
- `{PERSON}`: `man` أو `woman` (يأكدها المستخدم بالخطوة 1).
- `{PRONOUN}`: `his` أو `her`.
- `{LOOK}`: الملامح بجملة وحدة، بعد ما يصححها المستخدم. مثال: `short dark hair with a neat fade, full short dark beard and moustache, thick dark eyebrows, warm brown eyes, warm tan skin, friendly smile`. ولو تلبس حجاب: `wearing a neatly wrapped black hijab that fully covers the hair, exactly as in the photos`.
- `{OUTFIT}`: اللبس اللي اختاره بالتفصيل. مثال: `dark brown button-up work jacket with chest pocket worn open over a plain off-white crew-neck t-shirt, loose beige corduroy trousers, off-white sneakers`.
- `{STYLE}`: يتحدد بعد الخطوة 2 حسب الشكل اللي اختاره، وينحط بكل برومت بعدها:
  - **كرتوني:** `stylized 3D cartoon character in the look of a modern animated family film`
  - **مجسم ناعم:** `stylized 3D animated-film character in a modern feature-animation look`
  - **شبه واقعي:** `semi-realistic 3D CGI character, clearly a polished 3D render and not a photograph`
- `{CHANGE}`: التعديل اللي طلبه، كخطوة صغيرة وحدة (أمثلة تحت).

**لا تحط وصف للجسم** (`slim`، `heavy`) بأي برومت قبل الخطوة 3. الجسم هو يختاره من الدرجات.

---

## الخطوة 2: الأشكال
`gpt_image_2_6`، 9:16، `quality` = `high`، نسختين، وصوره كلها `image_references`.

### 1) كرتوني
```
A cute stylized 3D CARTOON character in the style of a modern animated family film, clearly NOT realistic and NOT a photo. Strong cartoon stylization: oversized head (about one quarter of total body height), big round expressive glossy eyes, small simplified nose, smooth clean skin with no pores, hair sculpted as chunky stylized shapes, any facial hair as a neat sculpted stylized shape, slightly oversized hands and sneakers, soft rounded forms like a collectible animated-movie figure. The character is a caricature of the {PERSON} in the reference photos and must still read as them: {LOOK}. Outfit from the photos, simplified: {OUTFIT}. Full body, standing relaxed facing the camera, arms at {PRONOUN} sides, whole figure visible head to toe with space above the head. Setting: calm tidy warm cartoon living room in soft daylight, plain wall, one plant, soft blur. Soft cinematic lighting, high quality 3D animation render. No text, no logos, no watermark, nothing in the hands.
```

### 2) مجسم ناعم
```
Create a stylized 3D animated-film character (modern feature-animation look, soft subsurface skin, slightly enlarged expressive eyes, slightly larger head, appealing simplified proportions) based on the {PERSON} in the reference photos. Keep the real likeness clearly recognizable: {LOOK}. Outfit exactly as in the photos: {OUTFIT}. Full body, standing relaxed and facing the camera, arms naturally at {PRONOUN} sides, whole figure visible head to toe with space above the head. Setting: a calm, tidy, warm modern living-room / home office in soft daylight, plain wall, one plant, shallow depth of field, nothing cluttered. Cinematic soft lighting, high detail 3D render. No text, no logos, no watermark, no props in the hands.
```

### 3) شبه واقعي
```
Create a semi-realistic 3D digital-human character (high-end CGI, realistic adult proportions, realistic skin and hair detail, but clearly a polished 3D render and not a photograph: slightly smoothed features, subtly stylized, clean look) based on the {PERSON} in the reference photos. Keep the real likeness clearly recognizable: {LOOK}. Outfit exactly as in the photos: {OUTFIT}. Full body, standing relaxed and facing the camera, arms naturally at {PRONOUN} sides, whole figure visible head to toe with space above the head. Setting: a calm, tidy, warm modern living-room / home office in soft daylight, plain wall, one plant, shallow depth of field, nothing cluttered. Cinematic soft lighting, high detail 3D render. No text, no logos, no watermark, no props in the hands.
```

### ويه من صورة وجسم من صورة
المراجع: صورة الويه أول، بعدها صورة الجسم. و`{STYLE}` هني = جملة شكل **صورة الويه** (حتى لو المستخدم ما اختار شكل نهائي بعد).
```
Two reference images show two versions of the same {STYLE}. Create ONE character that has the FACE and HEAD of the FIRST image (identical face design, eyes, eyebrows, hair, facial hair, skin tone and expression) and the BODY of the SECOND image (same proportions, build, outfit fit and pose). Same outfit: {OUTFIT}. Same rendering style and same level of stylization as the FIRST image. Full body visible head to toe, standing relaxed facing the camera, arms at {PRONOUN} sides, nothing in the hands. Setting: calm tidy warm living room in soft daylight, plain wall, one plant, soft blur. No text, no logos, no watermark.
```

---

## الخطوة 3: ضبط الجسم
`gpt_image_2_6`، 9:16، `high`، نسختين. المرجع: الصورة اللي اختارها بس.

### تعديل خطوة وحدة
```
Edit the reference image. Keep this exact same {STYLE}: the identical face design, same eyes, same eyebrows, same hair and facial-hair shapes, same smile and expression, same skin tone, same outfit ({OUTFIT}), same rendering style, same room, same lighting and same camera framing. Change ONLY the following, by one small step: {CHANGE}. Keep exactly the same level of stylization as the reference: do NOT make the face more realistic and do NOT add realistic skin detail. Full body visible head to toe, standing relaxed facing the camera, arms at {PRONOUN} sides, nothing in the hands. No text, no logos, no watermark.
```

أمثلة لـ`{CHANGE}`:
- **بالغ مو ياهل:** `the body proportions so the character reads as a grown adult instead of a kid: make the head slightly smaller relative to the body (about one fifth of total height instead of one quarter), make the torso and especially the legs a bit longer so the character is taller, shoulders a little broader, hands slightly smaller`
- **أعرض شوي:** `the body build: shoulders just slightly broader, torso a little fuller, jacket fits normally, not puffy`
- **البنطلون:** `the trousers fit: a regular relaxed straight fit, a little roomier, NOT wide-leg and NOT baggy; the shoes stay fully visible`

وزيد دايماً على التعديل: `Do NOT change the face, do NOT change head size or height`، إلا إذا التعديل نفسه على الراس أو الطول.

### بين صورتين
المراجع: الصورتين (الأولى ثم الثانية).
```
Two reference images show the same {STYLE} in two versions: the FIRST image is {FIRST_DESC}, the SECOND image is {SECOND_DESC}. Create the same character exactly HALFWAY between the two: {WHAT_TO_BLEND} midway between the first and the second image. Keep everything else exactly as in the first image: identical face design, eyes, eyebrows, hair and facial hair, smile, skin tone, head size, overall height, outfit ({OUTFIT}), rendering style and level of stylization, room, lighting and camera framing. Full body visible head to toe, standing relaxed facing the camera, arms at {PRONOUN} sides, nothing in the hands. No text, no logos, no watermark.
```
مثال: `{FIRST_DESC}` = `the slimmer build`، و`{SECOND_DESC}` = `the heavier build`، و`{WHAT_TO_BLEND}` = `shoulders, chest, arms, jacket width and trouser width`. وإذا يبي «أقرب للأولى»، بدّل `exactly HALFWAY` بـ`about one third of the way from the first toward the second`.

---

## الخطوة 4: التثبيت
`gpt_image_2_6`، `high`، نسختين. المرجع: `reference.png`.

### ورقة التعابير (3:2)
```
Character expression sheet of the exact same {STYLE} from the reference image: identical face design, eyes, eyebrows, hair and facial hair, same skin tone, same outfit top ({OUTFIT}), same rendering style. A clean grid of 6 head-and-shoulders portraits, 3 columns by 2 rows, all facing the camera, evenly spaced, same size, same soft lighting, on a plain flat warm cream background. Expressions, one per portrait: 1) neutral calm, mouth closed; 2) happy warm smile; 3) laughing with open mouth; 4) shocked, wide eyes and open mouth; 5) doubtful, one eyebrow raised and a side glance; 6) worried and stressed, eyebrows up in the middle. Keep the character clearly the same person in all six. No text, no labels, no numbers, no logos, no watermark.
```

### ورقة الوقفات (3:2)
```
Character pose sheet of the exact same {STYLE} from the reference image: identical face design, eyes, eyebrows, hair and facial hair, same skin tone, same proportions and build as the reference, same outfit ({OUTFIT}), same rendering style. Six full-body poses in a grid, 3 columns by 2 rows, evenly spaced, same scale, feet on the same ground line in each row, soft even lighting, plain flat warm cream background with soft contact shadows. Poses: 1) standing front view, relaxed; 2) standing three-quarter view; 3) standing side profile view; 4) talking to the camera with one open hand gesturing as if explaining; 5) pointing with the index finger to the side at something next to {PRONOUN}; 6) thinking, one hand on the chin, looking up. Keep the character clearly the same person and same size in all six. No text, no labels, no numbers, no logos, no watermark, no props.
```

### الأساس الأخضر: نص جسم (9:16، للكلام)
المراجع: `reference.png` والورقتين.
```
The exact same {STYLE} from the reference images (same face, hair, facial hair, proportions, outfit: {OUTFIT}), standing naturally in a professional green-screen video studio as if filmed by a real camera. Calm friendly expression facing the camera, mouth closed, arms relaxed down at {PRONOUN} sides, centered. Medium shot from the top of the head down to mid-thigh: the top of the head at about 37-40% of the frame height, generous empty space above the head. The entire background is one perfectly flat, evenly lit solid chroma-key green (#00B140), no wall texture, no floor line, no props, no shadow on the green. Soft even neutral studio lighting on the character, clean edges, no green spill. Camera at chest height, straight on, everything in sharp focus. Same rendering style as the references. No text, no logos.
```

### الأساس الأخضر: كامل الجسم (9:16، إذا وافق)
```
The exact same {STYLE} from the reference image, same face, eyes, eyebrows, hair and facial hair, skin tone, same proportions and build as the reference, same outfit ({OUTFIT}), same rendering style and soft warm key lighting. Full body, standing relaxed facing the camera, arms at {PRONOUN} sides, calm friendly look, mouth closed in a soft smile. Centered and occupying about 70 percent of the frame height, with clear empty space on both sides, above the head and below the feet. BACKGROUND: one perfectly flat, uniform, pure chroma-key green color (#00B140) filling the entire frame edge to edge, no floor line, no gradient, no shadow on the ground, no props, no room. No green light or green reflections on the character. No text, no logos, no watermark.
```

---

## الخطوة 5: يتكلم على أخضر
`wan2_7`، 9:16، `start_image` و`end_image` نفس صورة الأساس (نص جسم)، و`audio_references` القطعة.
```
The same {STYLE} stands in front of a flat solid chroma-key green screen (#00B140) exactly as in the first frame and talks directly to the camera in a warm, natural, explaining tone, perfectly lip-synced to the audio, like a real presenter filmed by a locked-off camera. Locked static camera, no zoom, no pan, no cut, same framing from head to mid-thigh the whole time. The character stays in place. Natural relaxed conversational hand gestures at chest height that stay inside the frame. Mouth moves clearly with every word and closes in pauses. When the speech ends, the character settles back into the same calm pose as the first frame, arms relaxed. The background stays one perfectly flat evenly lit green the whole time: no shadows, no floor, no objects, no light changes. Same face, outfit, colors and proportions as the first frame.
```
**إذا الحركة تتكرر** (الكفين المفتوحة بكل جملة): زيد حركة محددة لكل جملة، مثل `points at own face when saying the first sentence, then opens one hand toward the viewer`، وزيد `not the same open-palms gesture every time`.

---

## بعدين: حركة بلا كلام (5 ثواني، مكتبة)
`wan2_7`، 9:16، 5 ثواني، `start_image` و`end_image` نفس الأساس الأخضر (كامل الجسم)، بلا صوت.
```
The same {STYLE} stands in front of a flat solid chroma-key green background (#00B140) exactly as in the first frame and {ACTION}. Locked static camera, no zoom, no pan, no cut, full body visible the whole time. Feet stay planted. Hands always stay inside the frame. The mouth moves slightly as if casually chatting. At the end, the character returns to exactly the same calm pose as the first frame. The background stays pure flat green: no floor, no shadow, no props. Same face, outfit, colors and proportions as the first frame.
```
أمثلة لـ`{ACTION}`: `points with the right index finger up at something above, clearly, with the arm extended`، و`thinks with one hand on the chin, looking up`، و`laughs warmly`، و`waves hello to the camera`. وللسكتات الطويلة بدّل جملة الفم بـ`The mouth stays closed, listening`.
