import { useNavigate } from 'react-router-dom';

export const RULES = [
  {
    title: 'Sexually explicit or violent media must be marked as sensitive or with a content warning',
    body: 'This includes content that is particularly provocative even if it may not show specific body parts, as well as dead bodies, gore, or graphic violence.',
  },
  {
    title: 'No racism, sexism, homophobia, transphobia, ableism, xenophobia, or casteism.',
    body: 'Transphobic behavior such as intentional misgendering and deadnaming is strictly prohibited. Promotion of discrimination on any basis is not allowed.',
  },
  {
    title: 'No incitement of violence or promotion of violent ideologies',
    body: 'Calling for people or groups to be assassinated, murdered, or attacked physically is strictly prohibited. Support for terrorism or extremist groups is banned.',
  },
  {
    title: 'No harassment, block evasion, dogpiling, or doxxing of others',
    body: 'Repeat attempts to communicate with users who have blocked you or creation of accounts solely to harass or stalk others will result in permanent suspension.',
  },
  {
    title: 'Do not share information widely-known to be false and misleading',
    body: 'False and misleading information and links from low-quality sources may not be posted, especially if they are likely to cause real-world harm.',
  },
  {
    title: 'Content created by others must be attributed, and use of generative AI must be disclosed',
    body: 'Content created by others must clearly provide a reference to the author, creator, or source. AI-generated content must be disclosed with an appropriate content warning.',
  },
];

interface CommunityRulesProps {
  onAccept: () => void;
}

export default function CommunityRules({ onAccept }: CommunityRulesProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black uppercase text-black dark:text-white mb-1">
          Some ground rules.
        </h2>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          These are set and enforced by the Graphene community moderators.
        </p>
      </div>

      {/* Rules list with dotted connectors */}
      <ol className="relative flex flex-col">
        {RULES.map((rule, i) => (
          <li key={i} className="flex gap-4 group">
            {/* Left column: number bubble + dotted line */}
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Numbered circle */}
              <div className="w-9 h-9 rounded-full bg-indigo-600 border-2 border-black dark:border-gray-400 flex items-center justify-center text-white font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] flex-shrink-0 z-10">
                {i + 1}
              </div>
              {/* Dotted connector — hidden after last item */}
              {i < RULES.length - 1 && (
                <div className="flex-1 w-px border-l-2 border-dashed border-gray-300 dark:border-gray-600 my-2" />
              )}
            </div>

            {/* Rule text */}
            <div className={`pb-6 flex-1 ${i === RULES.length - 1 ? 'pb-0' : ''}`}>
              <p className="font-black text-black dark:text-white text-sm leading-snug mb-1">
                {rule.title}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                {rule.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4" />

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onAccept}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-4 border-black dark:border-gray-400 px-6 py-3 font-black uppercase tracking-wide hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
        >
          Accept
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-white dark:bg-gray-700 text-black dark:text-white border-4 border-black dark:border-gray-500 px-6 py-3 font-black uppercase tracking-wide hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
