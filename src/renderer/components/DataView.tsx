/**
 * Data View Component
 * Displays lab data in tables and provides basic data management
 */

import React, { useState, useEffect } from 'react';
import { FaSync } from 'react-icons/fa';

interface Animal {
  id: number;
  number: number;
  currentCage: number | null;
  currentWeight: number | null;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Reading {
  id: number;
  animalId: number;
  weight: number;
  cageId: number;
  timestamp: Date;
  notes: string | null;
  sessionId: number;
}

export const DataView: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'animals' | 'readings'>('animals');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // For MVP, use mock data since database might not be fully connected yet
      setAnimals([]);
      setReadings([]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="data-view loading">
        <div className="loading-spinner">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="data-view">
      <div className="data-view-header">
        <h2>Lab Data</h2>
        <div className="tab-controls">
          <button 
            className={`tab-button ${activeTab === 'animals' ? 'active' : ''}`}
            onClick={() => setActiveTab('animals')}
          >
            Animals
          </button>
          <button 
            className={`tab-button ${activeTab === 'readings' ? 'active' : ''}`}
            onClick={() => setActiveTab('readings')}
          >
            Readings
          </button>
        </div>
      </div>

      <div className="data-view-content">
        <div className="data-table-container">
          <div className="table-header">
            <h3>{activeTab === 'animals' ? 'Animals' : 'Readings'} (0)</h3>
            <button className="refresh-button" onClick={loadData}>
<FaSync /> Refresh
            </button>
          </div>
          
          <div className="empty-state">
            <p>No data recorded yet.</p>
            <p>Start by recording some data with voice commands!</p>
          </div>
        </div>
      </div>

      <div className="data-view-footer">
        <div className="stats">
          <span className="stat-item">
            <strong>0</strong> animals tracked
          </span>
          <span className="stat-item">
            <strong>0</strong> total readings
          </span>
          <span className="stat-item">
            Last updated: {formatDate(new Date())}
          </span>
        </div>
      </div>
    </div>
  );
};