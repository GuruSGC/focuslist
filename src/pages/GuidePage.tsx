const SHORTCUTS = [
  { keys: ['N'], action: 'Jump to the new task field' },
  { keys: ['/'], action: 'Jump to search' },
  { keys: ['Enter'], action: 'Add a task, or save an edit' },
  { keys: ['Esc'], action: 'Cancel an edit' },
] as const

const PAGES = [
  { name: 'Tasks', text: 'Add, complete, edit and delete tasks. Search and filter by status or priority.' },
  { name: 'Overview', text: 'See progress, a priority breakdown, and what to do next.' },
] as const

export function GuidePage() {
  return (
    <div className="page pt-2 sm:pt-6">
      <h1 id="page-title" tabIndex={-1} className="text-3xl sm:text-4xl">
        Guide
      </h1>

      <div className="sheet mt-3 sm:mt-4">
        <section aria-labelledby="pages-heading" className="p-4">
          <h2 id="pages-heading" className="mb-2 text-lg">
            Pages
          </h2>
          <dl className="grid gap-2">
            {PAGES.map((page) => (
              <div key={page.name}>
                <dt className="inline font-bold">{page.name}. </dt>
                <dd className="inline text-sumi-soft">{page.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="keys-heading" className="p-4">
          <h2 id="keys-heading" className="mb-3 text-lg">
            Keyboard Shortcuts
          </h2>
          <dl className="grid gap-2">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.action} className="flex items-center justify-between gap-3">
                <dt className="text-sumi-soft">{shortcut.action}</dt>
                <dd>
                  {shortcut.keys.map((key) => (
                    <kbd key={key} className="kbd">
                      {key}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="data-heading" className="p-4">
          <h2 id="data-heading" className="mb-2 text-lg">
            Your Data
          </h2>
          <p className="text-sumi-soft">
            Tasks are saved in this browser only. Nothing is sent anywhere, and clearing site data removes them.
          </p>
        </section>

        <section aria-labelledby="credits-heading" className="p-4">
          <h2 id="credits-heading" className="mb-2 text-lg">
            Credits
          </h2>
          <p className="text-sumi-soft">
            Original vector artwork inspired by ukiyo-e prints. Set in Shippori Mincho B1, Zen Kaku Gothic New and Yuji Syuku, all under the SIL
            Open Font License.
          </p>
        </section>
      </div>
    </div>
  )
}
