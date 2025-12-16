import Link from "next/link";
import { Flame, Palette, Zap, Sparkles, Droplets } from "lucide-react";

export function Introduction() {
  return (
    <div className="flex flex-col items-center gap-10 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 px-4">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="relative inline-block mb-4">
          <Flame className="w-20 h-20 text-orange-500 animate-pulse relative z-10" />
          <div className="absolute inset-0 bg-orange-500/30 blur-2xl rounded-full -z-0 animate-pulse"></div>
        </div>

        <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">
          言葉は、残るから重い。
          <br />
          消えるから美しい。
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
          ここは、刹那を彩る「デジタル花火大会」会場です。
          <br className="hidden md:block" />
          HANABIは、誰かの反応を待つためのSNSではありません。
          <br />
          あなたの心にある言葉を、夜空に打ち上げ、
          <br />
          その輝き自体を楽しむための場所です。
        </p>
      </div>

      {/* Concept Section */}
      <div className="w-full bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden group">
        <div className="relative z-10 text-center space-y-4">
          <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span className="text-3xl">🎆</span> コンセプト：入力＝快感
          </h3>
          <p className="text-white/70 leading-relaxed text-lg">
            「いいね」の数や、既読の有無に疲れていませんか？
            <br />
            ここでは、投稿ボタンを押した瞬間がクライマックスです。
            <br />
            あなたの言葉は色鮮やかな花火となり、10秒間だけ夜空を焦がして消えていきます。
          </p>
          <div className="pt-4 text-white/90 font-medium">
            1人なら、静かな線香花火として。
            <br />
            みんななら、夜空を埋め尽くす大花火として。
            <br />
            <span className="text-orange-300">
              「つながり」よりも「高揚感」を大切にした
            </span>
            、新しいコミュニケーションの形です。
          </div>
        </div>
      </div>

      {/* How to Play Section */}
      <div className="w-full">
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <span className="text-yellow-400">✨</span> HANABIの遊び方
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                <Palette size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  1. 感情を色に変える
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  あなたの投稿内容は、AIがリアルタイムで分析します。
                  ポジティブな言葉は情熱的な
                  <strong className="text-red-400">「赤」</strong>へ、
                  悲しみや憂いは静寂の
                  <strong className="text-blue-400">「青」</strong>へ。
                  言葉の意味が、そのまま光の色となって夜空を彩ります。
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  2. 共鳴と連鎖（タップ＆連打）
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  夜空に上がった花火（他人の投稿）をタップしてみてください。
                  「いいね」を送る代わりに、追加の火薬を投入して
                  <strong className="text-yellow-300">「誘爆」</strong>
                  させることができます。
                  連打すればするほど花火は巨大化し、画面全体を巻き込む光の連鎖が生まれます。
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  3. 灰が積もれば、奇跡が起きる
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  花火が打ち上がるたび、タイムラインには静かに「灰」が降り積もります。
                  画面が灰で埋め尽くされた時……夜空は限界を迎え、
                  <strong className="text-white text-shadow-glow">
                    「スターマイン（大爆発）」
                  </strong>
                  が巻き起こります。圧倒的なフィナーレを目撃してください。
                </p>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                <Droplets size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">
                  4. 過去は水に流す
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  書き損じた言葉や、消したい思いは、画面上の
                  <strong className="text-cyan-300">「水バケツ」</strong>
                  へ放り込んでください。
                  ジュッという音と共に、跡形もなく消滅します。
                  ログは残りません。あるのは、今この瞬間の煌めきと、生成される音楽だけです。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="flex flex-col items-center gap-6 mt-8 py-8 border-t border-white/10 w-full">
        <p className="text-xl text-white/80 font-medium text-center">
          さあ、導火線に火をつける準備はできましたか？
          <br />
          <span className="text-orange-400">
            あなたの言葉で、この夜空を焦がしてください。
          </span>
        </p>
        <Link
          href="/sns"
          className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-600 to-purple-600 group-hover:scale-105 transition-transform duration-300"></div>
          <span className="relative text-white font-bold text-xl flex items-center gap-2">
            導火線に火をつける
            <Flame className="w-5 h-5 group-hover:scale-125 transition-transform" />
          </span>
        </Link>
      </div>
    </div>
  );
}
