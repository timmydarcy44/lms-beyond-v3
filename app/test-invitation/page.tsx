'use client';

import { useState } from 'react';
import { inviteLearnerWithAssignments } from '../(dashboard)/admin/utilisateurs/invite-learner-with-assignments';

export default function TestInvitationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testInvitation = async () => {
    setLoading(true);
    try {
      const result = await inviteLearnerWithAssignments({
        email: 'timdarcypro@gmail.com',
        formationIds: [],
        testIds: [],
        resourceIds: [],
        pathwayIds: []
      });
      setResult(result);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test d'invitation d'apprenant</h1>
        
        <div className="glass rounded-xl p-6 mb-6">
          <button
            onClick={testInvitation}
            disabled={loading}
            className="btn-cta w-full"
          >
            {loading ? 'Test en cours...' : 'Tester l\'invitation'}
          </button>
        </div>

        {result && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Résultat :</h2>
            <pre className="bg-gray-800 p-4 rounded-lg text-green-400 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
