import Image from 'next/image'

export const metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM | Organization Structure',
}

export default function OrganizationalStructurePage() {
  return (
    <div className="structure">
      <div className="structure_heading">
        <h1>Organization Structure</h1>
      </div>

      <div className="structure_img">
        <Image src="/images/structure.png" alt="structure" width={1200} height={800} sizes="100vw" />
      </div>
    </div>
  )
}
