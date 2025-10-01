import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Frontend is Working! 🎉
        </h1>
        <p className="text-gray-600 mb-4">
          The admin frontend application is loading correctly.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            <strong>API URL:</strong> {import.meta.env.VITE_API_URL}
          </p>
          <p>
            <strong>Environment:</strong> {import.meta.env.MODE}
          </p>
        </div>
        <button
          onClick={() => {
            fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/health`
            )
              .then(res => res.json())
              .then(data => {
                alert(
                  'Backend connection successful! ' +
                    JSON.stringify(data, null, 2)
                );
              })
              .catch(err => {
                alert('Backend connection failed: ' + err.message);
              });
          }}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Test Backend Connection
        </button>
      </div>
    </div>
  );
};

export default TestPage;
