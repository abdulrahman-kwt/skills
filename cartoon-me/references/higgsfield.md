# شلون توصل Higgsfield

Higgsfield يبي **اشتراك مدفوع**، وكل توليد ياكل رصيد. والكلفة تنقال للمستخدم قبل كل خطوة، **من أداة الكلفة، مو من الجدول تحت**. وإذا ما في أداة كلفة للطلب (الموقع بإيده، أو التكبير لـ4K)، قوله رقم الجدول وقول إنه تقريبي، وانطر موافقته.

## الطريقة 1: أدوات MCP (الأسهل)
إذا عندك أدوات Higgsfield مثل `generate_image` و`generate_video`، فأنت مربوط.
وإذا ما عندك وتبي تربط:
- **Claude Code:** المستخدم يشغّل بالـTerminal: `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp`، وبعدها داخل Claude Code يكتب `/mcp` ويسجّل دخول بحساب Higgsfield.
- **تطبيق Claude:** Settings → Connectors → Add custom connector، والرابط `https://mcp.higgsfield.ai/mcp`، وبعدها الدخول بحساب Higgsfield.
- **ChatGPT:** من دليل التطبيقات، أضف Higgsfield.

| الشغلة | الأداة | الإعدادات |
|---|---|---|
| رفع صورة أو صوت (عندك ملفات) | `media_upload`، بعدها ارفع الملف على الرابط اللي يرجع (PUT)، بعدها `media_confirm` | احفظ رقم الرفع |
| رفع صورة أو صوت (شات بلا ملفات، أو الـPUT فشل) | `media_upload_widget`، **بروحها بنفس الدور**، والمستخدم يختار الملف | احفظ رقم الرفع |
| صورة | `generate_image` | `model` = `gpt_image_2_6`، و`aspect_ratio` (`9:16` أو `3:2`)، و`quality` = `high`، و`resolution` = `1k`، و`count` = 2، و`medias` = `[{role: "image_references", value: <رقم>}]` |
| كذا صورة ببرومتات مختلفة (مثل الأشكال الثلاثة) | `generate_image_batch` | نفس الإعدادات، بس كل طلب `count` = 1، فالنسختين طلبين. وبعدها `jobs_wait` بكل الأرقام، والنتيجة فيها `result_url` تنزّله على طول |
| مقطع يتكلم | `generate_video` | `model` = `wan2_7`، و`aspect_ratio` = `9:16`، و`resolution` (`720p` أو `1080p`)، و`duration` من 2 لين 15، و`medias` بأدوار `start_image` و`end_image` و`audio_references` |
| تصليح الشفايف | `generate_video` | `model` = `sync_so`، و`sync_mode` = `cut_off`، و`medias` بأدوار `input_video` (رقم الـjob حق مقطع Wan) و`input_audio` (رقم رفع القطعة) |
| 4K | `upscale_video` | `provider` = `bytedance`، و`preset` = `aigc`، و`resolution` = `4k`، و`fps` = 30، و`video_id` (رقم الـjob حق مقطع Sync)، و`width` و`height` من `ffprobe` |
| صورة مولّدة تبيها مرجع لطلب بعده (المرجع، الورقتين، الأساس) | حط **رقم الـjob** حقها بـ`value`. وإذا انرفض، ارفع الملف اللي نزّلته بـ`media_upload` واستخدم رقم الرفع | اكتب الرقمين بالبطاقة |
| انطر النتيجة | `jobs_wait` (أو اللي يقابلها عندك) | برقم الـjob. **لا ترسل الطلب مرة ثانية وهو بعده يشتغل.** مقطع Wan ياخذ من 3 لين 10 دقايق حتى لو 3 ثواني، وSync دقيقتين تقريباً. قول للمستخدم إنه بعده يشتغل، وانطر |
| جيب الرابط | `jobs_wait` يرجّع `result_url` لما الطلب يخلص (أو `job_display` لطلب واحد) | نزّل الملف من الرابط (`curl -o`) لمجلده بالاسم المرقم |
| الكلفة قبل التوليد | `estimate_image_cost` و`estimate_video_cost` | نفس إعدادات التوليد بالضبط |
| الرصيد | `balance` | |
| إعدادات أي موديل | `models_explore` بـ`action` = `get` | إذا شي تغيّر عن هالجدول، صدّق الأداة |

## الطريقة 2: الـCLI (كلود كود وكودكس)
1. شيّك على Node: `node --version`. إذا ما طلع رقم، قوله ينزّل Node من nodejs.org أول.
2. التركيب، بعد موافقته:
   ```bash
   npm i -g @higgsfield/cli
   ```
   واختياري: `npx skills add higgsfield-ai/skills` يركّب سكلات Higgsfield الرسمية. تفيدك بس تتأكد من أسماء الخيارات، **وما تمشي الشغل بدالك** (القاعدة 7).
3. **الدخول يسويه هو بنفسه**، لأنه يفتح المتصفح: `higgsfield auth login` (بـClaude Code يكتبه بالشات وقبله علامة `!`، وبـCodex بالـTerminal).
4. تأكد إنه دخل: `higgsfield model list` يطلّع الموديلات.

الأوامر:
- `higgsfield generate create <model> --help`: خيارات الموديل بالضبط. **شغّله قبل أول استخدام لأي موديل، ولا تخمّن أسماء الخيارات.**
- `higgsfield upload <file>`: رفع صورة أو صوت.
- `higgsfield generate create <model> --prompt "..." ...`: توليد.
- `higgsfield generate cost ...`: الكلفة قبل التوليد.
- `higgsfield generate wait <job_id>` و`higgsfield generate get <job_id>`: انطر النتيجة وجيبها.

الموديلات نفس اللي بالطريقة 1 (`gpt_image_2_6` و`wan2_7` و`sync_so`)، بنفس الأدوار. إذا `sync_so` أو التكبير مو موجودين بـ`higgsfield model list`، سوّهم من الموقع (الطريقة 3).

## الطريقة 3: الموقع بإيده (higgsfield.ai)
لكل خطوة، أعطه:
1. أي موديل يختار (GPT Image 2.6، أو Wan 2.7، أو Sync Lipsync 3).
2. أي صور أو صوت يرفع، وبأي ترتيب.
3. البرومت كامل، يلصقه مثل ما هو.
4. المقاس (9:16 أو 3:2)، والدقة، والمدة.

**إذا الصفحة ما فيها مكان لصورة النهاية أو للصوت** (Wan 2.7)، وقف وقوله. لا تكمّل بطريقة ثانية تغيّر النتيجة. وبعد كل خطوة، انطره لين ينزّل النتيجة ويقولك.

## الكلفة (انقاست 19 نوفمبر 2026، ممكن تتغيّر)
| الشي | الكلفة تقريباً |
|---|---|
| صورتين GPT Image 2.6 (`high`، `1k`) | 3 رصيد |
| Wan 2.7 بدقة 720p | 1.5 رصيد للثانية |
| Wan 2.7 بدقة 1080p | 2.5 رصيد للثانية |
| Sync Lipsync 3 | 3.6 رصيد للثانية تقريباً |
| تكبير 4K | 0.8 رصيد للثانية تقريباً |

**الرحلة كاملة** (3 أشكال، و3 جولات ضبط، والورقتين، وصورتين أساس، و10 ثواني كلام بدقة 1080p مع Sync و4K): **تقريباً 100 رصيد.**
**نسخة تجربة** (720p، و5 ثواني، بلا 4K، وجولة ضبط وحدة، وأساس نص جسم بس): **تقريباً 50 رصيد.**

## تركيب ffmpeg
شيّك أول: `ffmpeg -version`. إذا مو موجود، وبعد موافقة المستخدم:
- **Mac:** `brew install ffmpeg`. وإذا `brew` نفسه مو موجود، قوله ينزّله من brew.sh أول (أمر واحد بالـTerminal)، أو كمّل بدون ffmpeg.
- **Windows:** `winget install Gyan.FFmpeg`، وبعدها يسكّر الـTerminal ويفتحه.

وإذا ما يبي يركّب شي، الأداة تمشي بدونه (الخطوة 0 بـ`SKILL.md`).

## أوامر تحتاجها (ffmpeg)

### شوف النسخ جنب بعض
الصور لازم تكون نفس المقاس (نفس الخطوة). الترقيم من اليسار لليمين، وبعدين الصف الثاني:
```bash
ffmpeg -i 1.png -i 2.png -i 3.png -i 4.png -i 5.png -i 6.png -filter_complex "[0][1][2]hstack=inputs=3[a];[3][4][5]hstack=inputs=3[b];[a][b]vstack=inputs=2" compare.png
open compare.png
```
هذا لست صور (صفين). ولغيرها:
```bash
# صورتين
ffmpeg -i 1.png -i 2.png -filter_complex "[0][1]hstack=inputs=2" compare.png
# ثلاث صور
ffmpeg -i 1.png -i 2.png -i 3.png -filter_complex "[0][1][2]hstack=inputs=3" compare.png
# أربع صور (صفين)
ffmpeg -i 1.png -i 2.png -i 3.png -i 4.png -filter_complex "[0][1]hstack=inputs=2[a];[2][3]hstack=inputs=2[b];[a][b]vstack=inputs=2" compare.png
```
أضف `-y` إذا الملف موجود. **بـWindows:** بدال `open` اكتب `start`، وبدال `grep` اكتب `findstr`، و`curl` موجود جاهز.

### الصوت
```bash
ffmpeg -i voice.m4a -c:a libmp3lame -q:a 2 voice.mp3
ffprobe -v error -show_entries format=duration -of csv=p=0 voice.mp3
ffmpeg -i voice.mp3 -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1 | grep silence_
ffmpeg -i voice.mp3 -ss 0 -to 9.3 -c:a libmp3lame -q:a 2 audio/1.mp3
```
- الأول يحوّل m4a لـmp3. ونفسه يشتغل على wav أو على فيديو (يطلّع الصوت بس): غيّر اسم الملف الأول.
- الثاني يطلّع الطول بالثواني.
- الثالث يطلّع أوقات السكتات.
- الرابع يقص قطعة. اختار نقاط القص بنص السكتات، وكل قطعة من 2 لين 15 ثانية.

وكمّل كل قطعة بسكتة لين الثانية الكاملة قبل الرفع (هني لين 3 ثواني):
```bash
ffmpeg -i audio/1.mp3 -af apad -t 3 -c:a libmp3lame -q:a 2 audio/1-pad.mp3
```

### عرض وطول مقطع
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 video/sync.mp4
```

### شيل الأخضر
- **CapCut أو أي برنامج فيه Chroma Key:** خل المقطع الأخضر مثل ما هو.
- **iMovie أو Final Cut** (`.mov` شفاف، ProRes 4444):
  ```bash
  ffmpeg -i talk.mp4 -vf "chromakey=0x00B140:0.13:0.06,despill=type=green,format=yuva444p10le" -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -c:a pcm_s16le talk.mov
  ```
- **مونتاج بالكود أو الويب** (`.webm` شفاف):
  ```bash
  ffmpeg -i talk.mp4 -vf "chromakey=0x00B140:0.13:0.06,despill=type=green" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -auto-alt-ref 0 -c:a libopus talk.webm
  ```

إذا بقى أخضر حول الشعر أو الأصابع، كبّر الرقم `0.13` شوي شوي. وإذا بدت الحواف تنقص من الشخصية، صغّره.
