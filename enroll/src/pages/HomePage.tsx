import { Link } from 'react-router-dom'
import { EnrollLayout } from '../components/EnrollLayout'

export function HomePage() {
  return (
    <EnrollLayout
      title="MSME registration"
      subtitle="Open the personal link from your WhatsApp invitation."
    >
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <p>
          Each invitation uses a <strong>unique link</strong> sent by TIDCO. If you received
          WhatsApp, tap that link — do not change the address in your browser.
        </p>
        <p className="text-slate-600">
          <strong>Local development:</strong> preview the enrollment form (no backend invite required):
        </p>
        <Link
          to="/enroll/demo"
          className="inline-block rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800"
        >
          Open demo enrollment link
        </Link>
      </div>
    </EnrollLayout>
  )
}
