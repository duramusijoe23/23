export interface NetworkFeature {
  timestamp: number;
  requestCount: number;
  failedRequests: number;
  responseTime: number;
  dataTransferred: number;
  uniqueDomains: number;
  httpErrors: number;
  suspiciousPatterns: number;
  memoryUsage: number;
  cpuUsage: number;
  clickRate: number;
  navigationRate: number;
}

export interface ThreatPrediction {
  isAnomaly: boolean;
  threatScore: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  features: string[];
  algorithm: 'random_forest' | 'isolation_forest' | 'ensemble';
}

export interface TrainingData {
  features: number[];
  label: number; // 0 = normal, 1 = threat
}

// Simple Random Forest implementation
class DecisionTree {
  private threshold: number = 0;
  private featureIndex: number = 0;
  private leftChild: DecisionTree | null = null;
  private rightChild: DecisionTree | null = null;
  private prediction: number = 0;
  private isLeaf: boolean = false;

  train(data: TrainingData[], maxDepth: number = 10, minSamples: number = 2): void {
    if (maxDepth === 0 || data.length < minSamples || this.isPure(data)) {
      this.isLeaf = true;
      this.prediction = this.majorityClass(data);
      return;
    }

    const bestSplit = this.findBestSplit(data);
    if (!bestSplit) {
      this.isLeaf = true;
      this.prediction = this.majorityClass(data);
      return;
    }

    this.featureIndex = bestSplit.featureIndex;
    this.threshold = bestSplit.threshold;

    const { left, right } = this.splitData(data, bestSplit.featureIndex, bestSplit.threshold);

    this.leftChild = new DecisionTree();
    this.rightChild = new DecisionTree();

    this.leftChild.train(left, maxDepth - 1, minSamples);
    this.rightChild.train(right, maxDepth - 1, minSamples);
  }

  predict(features: number[]): number {
    if (this.isLeaf) {
      return this.prediction;
    }

    if (features[this.featureIndex] <= this.threshold) {
      return this.leftChild!.predict(features);
    } else {
      return this.rightChild!.predict(features);
    }
  }

  private isPure(data: TrainingData[]): boolean {
    if (data.length === 0) return true;
    const firstLabel = data[0].label;
    return data.every(d => d.label === firstLabel);
  }

  private majorityClass(data: TrainingData[]): number {
    const counts = data.reduce((acc, d) => {
      acc[d.label] = (acc[d.label] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(counts).reduce((a, b) => 
      counts[parseInt(a)] > counts[parseInt(b[0])] ? a : b[0]
    ) as unknown as number;
  }

  private findBestSplit(data: TrainingData[]): { featureIndex: number; threshold: number; gini: number } | null {
    let bestGini = Infinity;
    let bestSplit = null;

    const numFeatures = data[0]?.features.length || 0;
    
    for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
      const values = data.map(d => d.features[featureIndex]).sort((a, b) => a - b);
      
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const gini = this.calculateGini(data, featureIndex, threshold);
        
        if (gini < bestGini) {
          bestGini = gini;
          bestSplit = { featureIndex, threshold, gini };
        }
      }
    }

    return bestSplit;
  }

  private calculateGini(data: TrainingData[], featureIndex: number, threshold: number): number {
    const { left, right } = this.splitData(data, featureIndex, threshold);
    
    const totalSize = data.length;
    const leftSize = left.length;
    const rightSize = right.length;

    if (leftSize === 0 || rightSize === 0) return Infinity;

    const leftGini = this.giniImpurity(left);
    const rightGini = this.giniImpurity(right);

    return (leftSize / totalSize) * leftGini + (rightSize / totalSize) * rightGini;
  }

  private splitData(data: TrainingData[], featureIndex: number, threshold: number): { left: TrainingData[]; right: TrainingData[] } {
    const left: TrainingData[] = [];
    const right: TrainingData[] = [];

    for (const sample of data) {
      if (sample.features[featureIndex] <= threshold) {
        left.push(sample);
      } else {
        right.push(sample);
      }
    }

    return { left, right };
  }

  private giniImpurity(data: TrainingData[]): number {
    if (data.length === 0) return 0;

    const counts = data.reduce((acc, d) => {
      acc[d.label] = (acc[d.label] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    let gini = 1;
    const total = data.length;

    for (const count of Object.values(counts)) {
      const probability = count / total;
      gini -= probability * probability;
    }

    return gini;
  }
}

class RandomForest {
  private trees: DecisionTree[] = [];
  private numTrees: number;

  constructor(numTrees: number = 100) {
    this.numTrees = numTrees;
  }

  train(data: TrainingData[]): void {
    this.trees = [];

    for (let i = 0; i < this.numTrees; i++) {
      const bootstrapData = this.bootstrap(data);
      const tree = new DecisionTree();
      tree.train(bootstrapData);
      this.trees.push(tree);
    }
  }

  predict(features: number[]): { prediction: number; confidence: number } {
    const predictions = this.trees.map(tree => tree.predict(features));
    const threatCount = predictions.filter(p => p === 1).length;
    const confidence = Math.abs(threatCount / this.numTrees - 0.5) * 2; // 0 to 1
    
    return {
      prediction: threatCount > this.numTrees / 2 ? 1 : 0,
      confidence
    };
  }

  private bootstrap(data: TrainingData[]): TrainingData[] {
    const bootstrapData: TrainingData[] = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      bootstrapData.push(data[randomIndex]);
    }
    return bootstrapData;
  }
}

class IsolationTree {
  private splitFeature: number = 0;
  private splitValue: number = 0;
  private left: IsolationTree | null = null;
  private right: IsolationTree | null = null;
  private size: number = 0;
  private isExternal: boolean = false;

  constructor(data: number[][], maxDepth: number, currentDepth: number = 0) {
    this.size = data.length;

    if (currentDepth >= maxDepth || data.length <= 1) {
      this.isExternal = true;
      return;
    }

    // Randomly select feature and split value
    const numFeatures = data[0]?.length || 0;
    this.splitFeature = Math.floor(Math.random() * numFeatures);
    
    const featureValues = data.map(row => row[this.splitFeature]);
    const minVal = Math.min(...featureValues);
    const maxVal = Math.max(...featureValues);
    
    if (minVal === maxVal) {
      this.isExternal = true;
      return;
    }

    this.splitValue = Math.random() * (maxVal - minVal) + minVal;

    // Split data
    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (const row of data) {
      if (row[this.splitFeature] < this.splitValue) {
        leftData.push(row);
      } else {
        rightData.push(row);
      }
    }

    if (leftData.length === 0 || rightData.length === 0) {
      this.isExternal = true;
      return;
    }

    this.left = new IsolationTree(leftData, maxDepth, currentDepth + 1);
    this.right = new IsolationTree(rightData, maxDepth, currentDepth + 1);
  }

  pathLength(point: number[], currentDepth: number = 0): number {
    if (this.isExternal) {
      return currentDepth + this.averagePathLength(this.size);
    }

    if (point[this.splitFeature] < this.splitValue) {
      return this.left!.pathLength(point, currentDepth + 1);
    } else {
      return this.right!.pathLength(point, currentDepth + 1);
    }
  }

  private averagePathLength(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private sampleSize: number;

  constructor(numTrees: number = 100, sampleSize: number = 256) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
  }

  train(data: number[][]): void {
    this.trees = [];
    const maxDepth = Math.ceil(Math.log2(this.sampleSize));

    for (let i = 0; i < this.numTrees; i++) {
      const sampleData = this.sample(data, this.sampleSize);
      const tree = new IsolationTree(sampleData, maxDepth);
      this.trees.push(tree);
    }
  }

  predict(point: number[]): { anomalyScore: number; isAnomaly: boolean } {
    const pathLengths = this.trees.map(tree => tree.pathLength(point));
    const averagePathLength = pathLengths.reduce((sum, length) => sum + length, 0) / pathLengths.length;
    
    const c = this.averagePathLength(this.sampleSize);
    const anomalyScore = Math.pow(2, -averagePathLength / c);
    
    return {
      anomalyScore,
      isAnomaly: anomalyScore > 0.6 // Threshold for anomaly detection
    };
  }

  private sample(data: number[][], size: number): number[][] {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(size, data.length));
  }

  private averagePathLength(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

export class MLThreatDetection {
  private randomForest: RandomForest;
  private isolationForest: IsolationForest;
  private trainingData: TrainingData[] = [];
  private featureHistory: NetworkFeature[] = [];
  private isTraining: boolean = false;
  private modelTrained: boolean = false;

  constructor() {
    this.randomForest = new RandomForest(50); // Smaller forest for browser performance
    this.isolationForest = new IsolationForest(50, 128);
    this.initializeTrainingData();
  }

  private initializeTrainingData(): void {
    // Generate synthetic training data for initial model
    const normalPatterns = this.generateNormalTrafficPatterns(200);
    const threatPatterns = this.generateThreatPatterns(50);
    
    this.trainingData = [
      ...normalPatterns.map(features => ({ features, label: 0 })),
      ...threatPatterns.map(features => ({ features, label: 1 }))
    ];

    this.trainModels();
  }

  private generateNormalTrafficPatterns(count: number): number[][] {
    const patterns: number[][] = [];
    
    for (let i = 0; i < count; i++) {
      patterns.push([
        Math.random() * 50 + 10,    // requestCount: 10-60
        Math.random() * 5,          // failedRequests: 0-5
        Math.random() * 200 + 50,   // responseTime: 50-250ms
        Math.random() * 1000 + 100, // dataTransferred: 100-1100KB
        Math.random() * 10 + 1,     // uniqueDomains: 1-11
        Math.random() * 3,          // httpErrors: 0-3
        0,                          // suspiciousPatterns: 0
        Math.random() * 50 + 20,    // memoryUsage: 20-70%
        Math.random() * 30 + 10,    // cpuUsage: 10-40%
        Math.random() * 5 + 1,      // clickRate: 1-6 per minute
        Math.random() * 3 + 0.5     // navigationRate: 0.5-3.5 per minute
      ]);
    }
    
    return patterns;
  }

  private generateThreatPatterns(count: number): number[][] {
    const patterns: number[][] = [];
    
    for (let i = 0; i < count; i++) {
      patterns.push([
        Math.random() * 200 + 100,  // requestCount: 100-300 (high)
        Math.random() * 50 + 10,    // failedRequests: 10-60 (high)
        Math.random() * 2000 + 500, // responseTime: 500-2500ms (slow)
        Math.random() * 5000 + 1000, // dataTransferred: 1-6MB (large)
        Math.random() * 50 + 20,    // uniqueDomains: 20-70 (many)
        Math.random() * 20 + 5,     // httpErrors: 5-25 (many)
        Math.random() * 10 + 3,     // suspiciousPatterns: 3-13 (high)
        Math.random() * 40 + 70,    // memoryUsage: 70-110% (high)
        Math.random() * 50 + 60,    // cpuUsage: 60-110% (high)
        Math.random() * 50 + 20,    // clickRate: 20-70 per minute (bot-like)
        Math.random() * 20 + 10     // navigationRate: 10-30 per minute (rapid)
      ]);
    }
    
    return patterns;
  }

  private async trainModels(): Promise<void> {
    if (this.isTraining) return;
    
    this.isTraining = true;
    
    try {
      // Train Random Forest
      this.randomForest.train(this.trainingData);
      
      // Train Isolation Forest
      const features = this.trainingData.map(d => d.features);
      this.isolationForest.train(features);
      
      this.modelTrained = true;
      console.log('🤖 ML Threat Detection models trained successfully');
    } catch (error) {
      console.error('❌ Error training ML models:', error);
    } finally {
      this.isTraining = false;
    }
  }

  extractFeatures(networkData: any): NetworkFeature {
    const now = Date.now();
    const recentHistory = this.featureHistory.filter(f => now - f.timestamp < 60000); // Last minute
    
    return {
      timestamp: now,
      requestCount: networkData.requestCount || 0,
      failedRequests: networkData.failedRequests || 0,
      responseTime: networkData.averageResponseTime || 0,
      dataTransferred: networkData.totalDataTransferred || 0,
      uniqueDomains: networkData.uniqueDomains || 0,
      httpErrors: networkData.httpErrors || 0,
      suspiciousPatterns: networkData.suspiciousPatterns || 0,
      memoryUsage: networkData.memoryUsage || 0,
      cpuUsage: networkData.cpuUsage || 0,
      clickRate: networkData.clickRate || 0,
      navigationRate: networkData.navigationRate || 0
    };
  }

  async detectThreats(networkData: any): Promise<ThreatPrediction> {
    if (!this.modelTrained) {
      return {
        isAnomaly: false,
        threatScore: 0,
        confidence: 0,
        riskLevel: 'low',
        features: [],
        algorithm: 'ensemble'
      };
    }

    const features = this.extractFeatures(networkData);
    this.featureHistory.push(features);
    
    // Keep only recent history
    this.featureHistory = this.featureHistory.filter(f => 
      Date.now() - f.timestamp < 300000 // Last 5 minutes
    );

    const featureVector = [
      features.requestCount,
      features.failedRequests,
      features.responseTime,
      features.dataTransferred,
      features.uniqueDomains,
      features.httpErrors,
      features.suspiciousPatterns,
      features.memoryUsage,
      features.cpuUsage,
      features.clickRate,
      features.navigationRate
    ];

    // Random Forest prediction
    const rfResult = this.randomForest.predict(featureVector);
    
    // Isolation Forest prediction
    const ifResult = this.isolationForest.predict(featureVector);
    
    // Ensemble prediction
    const threatScore = (rfResult.prediction * 0.6) + (ifResult.anomalyScore * 0.4);
    const confidence = (rfResult.confidence + (ifResult.anomalyScore > 0.6 ? 1 : 0)) / 2;
    const isAnomaly = rfResult.prediction === 1 || ifResult.isAnomaly;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (threatScore > 0.8) riskLevel = 'critical';
    else if (threatScore > 0.6) riskLevel = 'high';
    else if (threatScore > 0.4) riskLevel = 'medium';

    // Identify contributing features
    const contributingFeatures: string[] = [];
    if (features.failedRequests > 10) contributingFeatures.push('High failed requests');
    if (features.requestCount > 100) contributingFeatures.push('Excessive request volume');
    if (features.responseTime > 1000) contributingFeatures.push('Slow response times');
    if (features.suspiciousPatterns > 5) contributingFeatures.push('Suspicious patterns detected');
    if (features.memoryUsage > 80) contributingFeatures.push('High memory usage');
    if (features.clickRate > 20) contributingFeatures.push('Abnormal click patterns');

    return {
      isAnomaly,
      threatScore,
      confidence,
      riskLevel,
      features: contributingFeatures,
      algorithm: 'ensemble'
    };
  }

  // Retrain models with new data
  async retrainWithFeedback(features: NetworkFeature, isThreat: boolean): Promise<void> {
    const featureVector = [
      features.requestCount,
      features.failedRequests,
      features.responseTime,
      features.dataTransferred,
      features.uniqueDomains,
      features.httpErrors,
      features.suspiciousPatterns,
      features.memoryUsage,
      features.cpuUsage,
      features.clickRate,
      features.navigationRate
    ];

    this.trainingData.push({
      features: featureVector,
      label: isThreat ? 1 : 0
    });

    // Keep training data size manageable
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-800);
    }

    // Retrain periodically
    if (this.trainingData.length % 50 === 0) {
      await this.trainModels();
    }
  }

  getModelStats(): { 
    trainingDataSize: number; 
    modelTrained: boolean; 
    featureHistorySize: number;
    lastTrainingTime: Date | null;
  } {
    return {
      trainingDataSize: this.trainingData.length,
      modelTrained: this.modelTrained,
      featureHistorySize: this.featureHistory.length,
      lastTrainingTime: this.modelTrained ? new Date() : null
    };
  }
}

export const mlThreatDetection = new MLThreatDetection();