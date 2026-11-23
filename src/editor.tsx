import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './editor.css';

type Draft = { title: string; revision: number };
type Report = { errors: string[] };

const wait = () => new Promise<void>(resolve => setTimeout(resolve, 650));
const mockApi = {
	async health(draft: Draft): Promise<Report> {
		await wait();
		return { errors: draft.title.trim() ? [] : ['The draft needs a title.'] };
	},
	async publish(draft: Draft): Promise<Draft> {
		await wait();
		return { ...draft };
	},
};

function Editor() {
	const [draft, updateDraft] = useState<Draft>({ title: 'Camera kit', revision: 1 });
	const [published, setPublished] = useState<Draft | null>(null);
	const [report, setReport] = useState<Report | null>(null);
	const [phase, setPhase] = useState<'idle' | 'checking' | 'publishing'>('idle');
	const [message, setMessage] = useState('The draft is ready to review.');
	const latest = useRef(draft);
	const publishing = useRef(false);

	function edit(title: string) {
		const next = { title, revision: latest.current.revision + 1 };
		latest.current = next;
		updateDraft(next);
		setReport(null);
	}

	// Adapted from Hamsaz admin.tsx: bind checks to the draft snapshot and publish its reviewed revision.
	async function inspect() {
		setPhase('checking');
		const snapshot = latest.current;
		try {
			const response = await mockApi.health(snapshot);
			if (latest.current.revision !== snapshot.revision) {
				setMessage('The draft changed during review. Run the review again.');
				return;
			}
			setReport(response);
			setMessage(response.errors.join(' ') || 'This draft passed review.');
		} finally {
			setPhase('idle');
		}
	}

	async function publish() {
		if (publishing.current || !report || report.errors.length) return;
		const snapshot = latest.current;
		publishing.current = true;
		setPhase('publishing');
		try {
			const response = await mockApi.publish(snapshot);
			setPublished(response);
			if (latest.current.revision === snapshot.revision) {
				setMessage('Reviewed revision published.');
			} else {
				setMessage('Reviewed revision published. Your newer edits are still in the draft.');
			}
		} finally {
			publishing.current = false;
			setPhase('idle');
		}
	}

	return <main>
		<header><p>Hamsaz Configurator</p><h1>Draft publishing</h1></header>
		<div className="panels">
			<section aria-labelledby="draft-title">
				<h2 id="draft-title">Current draft <small>Revision {draft.revision}</small></h2>
				<label htmlFor="kit-title">Kit name</label>
				<input id="kit-title" value={draft.title} onChange={event => edit(event.target.value)} />
				<div className="actions">
					<button disabled={phase !== 'idle'} onClick={() => void inspect()}>Review draft</button>
					<button disabled={phase !== 'idle' || !report || report.errors.length > 0} onClick={() => void publish()}>Publish reviewed draft</button>
				</div>
			</section>
			<section aria-labelledby="published-title">
				<h2 id="published-title">Published version</h2>
				{published ? <><strong>{published.title}</strong><p>Revision {published.revision}</p></> : <p>Awaiting publication.</p>}
			</section>
		</div>
		<p role="status">{phase === 'idle' ? message : phase === 'checking' ? 'Reviewing the draft…' : 'Publishing reviewed revision…'}</p>
	</main>;
}

createRoot(document.getElementById('root')!).render(<Editor />);
