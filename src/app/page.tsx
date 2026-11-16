import EntryForm from "@/components/EntryForm";
import SiteNav from "@/components/SiteNav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="entry-hero page-enter">
        <div className="mug" aria-hidden="true" />
        <h1>Corner Mug</h1>
        <p className="muted" style={{ maxWidth: 420 }}>
          A cozy corner of the internet — pull up a chair, chat with friends,
          and study together. No accounts, no video, no voice.
        </p>
        <EntryForm />
      </main>
    </>
  );
}
