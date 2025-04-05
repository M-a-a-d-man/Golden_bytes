import CalendarComponent from './Calendar/demoApp';

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div style={{ width: '90%', margin: 'auto' }}>
          <CalendarComponent />
        </div>
      </main>
    </div>
  );
}