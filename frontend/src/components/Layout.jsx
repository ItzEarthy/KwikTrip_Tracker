import Layout from "./Layout";

export default function Landing() {
  const goToMap = (mode) => {
    localStorage.setItem("mode", mode);
    window.location.href = "/map";
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center space-y-6">
        <h2 className="text-xl font-semibold">Welcome to KwikTrip Tracker!</h2>
        <p>Select how you’d like to track progress:</p>
        <div className="space-y-3">
          <button className="btn w-full" onClick={() => goToMap("self")}>
            🧍 Track My Visits
          </button>
          <button className="btn w-full" onClick={() => goToMap("friend")}>
            👥 View a Friend’s Progress
          </button>
        </div>
      </div>
    </Layout>
  );
}
