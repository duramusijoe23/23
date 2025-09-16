import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Save, X, Wifi } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface BandwidthRule {
  id: string;
  ipAddress: string;
  deviceName?: string;
  uploadLimit: number;
  downloadLimit: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'inactive';
  createdAt: Date;
  lastModified: Date;
}

interface BandwidthAllocationProps {
  onRuleChange?: (rules: BandwidthRule[]) => void;
  theme?: Theme;
}

const BandwidthAllocation: React.FC<BandwidthAllocationProps> = ({ onRuleChange, theme = 'dark' }) => {
  const [rules, setRules] = useState<BandwidthRule[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ipAddress: '',
    deviceName: '',
    uploadLimit: 100,
    downloadLimit: 100,
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  useEffect(() => {
    const initialRules: BandwidthRule[] = [
      {
        id: '1',
        ipAddress: '192.168.1.100',
        deviceName: 'Admin Workstation',
        uploadLimit: 200,
        downloadLimit: 500,
        priority: 'high',
        status: 'active',
        createdAt: new Date(Date.now() - 86400000),
        lastModified: new Date(Date.now() - 3600000)
      },
      {
        id: '2',
        ipAddress: '192.168.1.150',
        deviceName: 'Marketing Laptop',
        uploadLimit: 50,
        downloadLimit: 150,
        priority: 'medium',
        status: 'active',
        createdAt: new Date(Date.now() - 172800000),
        lastModified: new Date(Date.now() - 7200000)
      },
      {
        id: '3',
        ipAddress: '192.168.1.205',
        deviceName: 'Guest Device',
        uploadLimit: 25,
        downloadLimit: 75,
        priority: 'low',
        status: 'inactive',
        createdAt: new Date(Date.now() - 259200000),
        lastModified: new Date(Date.now() - 14400000)
      }
    ];

    setRules(initialRules);
    onRuleChange?.(initialRules);
  }, [onRuleChange]);

  const handleAddRule = () => {
    if (!formData.ipAddress) return;

    const newRule: BandwidthRule = {
      id: Math.random().toString(36).substr(2, 9),
      ipAddress: formData.ipAddress,
      deviceName: formData.deviceName || undefined,
      uploadLimit: formData.uploadLimit,
      downloadLimit: formData.downloadLimit,
      priority: formData.priority,
      status: 'active',
      createdAt: new Date(),
      lastModified: new Date()
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    onRuleChange?.(updatedRules);
    
    setFormData({
      ipAddress: '',
      deviceName: '',
      uploadLimit: 100,
      downloadLimit: 100,
      priority: 'medium'
    });
    setShowAddForm(false);
  };

  const handleEditRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      setFormData({
        ipAddress: rule.ipAddress,
        deviceName: rule.deviceName || '',
        uploadLimit: rule.uploadLimit,
        downloadLimit: rule.downloadLimit,
        priority: rule.priority
      });
      setEditingRule(ruleId);
    }
  };

  const handleUpdateRule = () => {
    if (!editingRule || !formData.ipAddress) return;

    const updatedRules = rules.map(rule =>
      rule.id === editingRule
        ? {
            ...rule,
            ipAddress: formData.ipAddress,
            deviceName: formData.deviceName || undefined,
            uploadLimit: formData.uploadLimit,
            downloadLimit: formData.downloadLimit,
            priority: formData.priority,
            lastModified: new Date()
          }
        : rule
    );

    setRules(updatedRules);
    onRuleChange?.(updatedRules);
    setEditingRule(null);
    setFormData({
      ipAddress: '',
      deviceName: '',
      uploadLimit: 100,
      downloadLimit: 100,
      priority: 'medium'
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    setRules(updatedRules);
    onRuleChange?.(updatedRules);
  };

  const handleToggleStatus = (ruleId: string) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId
        ? {
            ...rule,
            status: rule.status === 'active' ? 'inactive' as const : 'active' as const,
            lastModified: new Date()
          }
        : rule
    );

    setRules(updatedRules);
    onRuleChange?.(updatedRules);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'text-green-400 bg-green-900/20' 
      : 'text-gray-400 bg-gray-900/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Bandwidth Allocation</h3>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingRule) && (
        <div className={`rounded-xl p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h4 className="text-lg font-medium mb-4">
            {editingRule ? 'Edit Bandwidth Rule' : 'Add New Bandwidth Rule'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                IP Address *
              </label>
              <input
                type="text"
                value={formData.ipAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
                placeholder="192.168.1.100"
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Device Name (Optional)
              </label>
              <input
                type="text"
                value={formData.deviceName}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                placeholder="Admin Workstation"
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Upload Limit (Mbps)
              </label>
              <input
                type="number"
                value={formData.uploadLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, uploadLimit: parseInt(e.target.value) || 0 }))}
                min="1"
                max="1000"
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white'
                    : 'bg-gray-50 border border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Download Limit (Mbps)
              </label>
              <input
                type="number"
                value={formData.downloadLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, downloadLimit: parseInt(e.target.value) || 0 }))}
                min="1"
                max="1000"
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white'
                    : 'bg-gray-50 border border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white'
                    : 'bg-gray-50 border border-gray-300 text-gray-900'
                }`}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingRule(null);
                setFormData({
                  ipAddress: '',
                  deviceName: '',
                  uploadLimit: 100,
                  downloadLimit: 100,
                  priority: 'medium'
                });
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
              }`}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={editingRule ? handleUpdateRule : handleAddRule}
              disabled={!formData.ipAddress}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{editingRule ? 'Update Rule' : 'Add Rule'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h4 className="text-lg font-medium mb-4">Active Bandwidth Rules</h4>
        
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <Wifi className={`h-12 w-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              No bandwidth rules configured
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>Add rules to control bandwidth allocation for specific devices</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className={`rounded-lg p-4 border ${
                theme === 'dark' 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{rule.ipAddress}</h5>
                      {rule.deviceName && (
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>({rule.deviceName})</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rule.priority)}`}>
                        {rule.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(rule.status)}`}>
                        {rule.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Upload Limit:
                        </span>
                        <span className="text-green-400 ml-2 font-medium">{rule.uploadLimit} Mbps</span>
                      </div>
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Download Limit:
                        </span>
                        <span className="text-blue-400 ml-2 font-medium">{rule.downloadLimit} Mbps</span>
                      </div>
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Last Modified:
                        </span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{rule.lastModified.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(rule.id)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        rule.status === 'active'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {rule.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleEditRule(rule.id)}
                      className={`p-2 rounded transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className={`p-2 rounded transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
                          : 'text-gray-600 hover:text-red-600 hover:bg-gray-200'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl p-4 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{rules.length}</p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Total Rules</p>
          </div>
        </div>
        <div className={`rounded-xl p-4 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{rules.filter(r => r.status === 'active').length}</p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Active Rules</p>
          </div>
        </div>
        <div className={`rounded-xl p-4 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {rules.reduce((sum, rule) => sum + rule.uploadLimit + rule.downloadLimit, 0)}
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Total Allocated (Mbps)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandwidthAllocation;