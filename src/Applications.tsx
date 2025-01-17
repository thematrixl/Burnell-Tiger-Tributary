import { useState, useEffect } from "react";
import SingleApplication from "./SingleApplication";
import styles from "./Applications.module.css";
import { Button } from "./ui/Button/Button";

const Applications = () => {
  const limit = 5;
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    try {
      if (loading) return;

      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/applications?_page=${page}&_limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      // Append new data to the existing list instead of replacing it
      setApplications((prevApplications) => [...prevApplications, ...data]);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Error fetching applications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page]);

  return (
    <div className={styles.Applications}>
      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div>
          <div>
            {applications.map((application) => (
              <SingleApplication
                key={application.id}
                application={application}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loading}
                className="w-48"
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
