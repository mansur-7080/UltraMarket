import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Tab, Listbox, Disclosure } from '@headlessui/react';
import { 
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  BookmarkIcon,
  ShoppingCartIcon,
  ShareIcon,
  BoltIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PrinterIcon,
  ArrowsRightLeftIcon,
  StarIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Professional TypeScript interfaces
interface ComponentSpec {
  name: string;
  value: string | number;
  unit?: string;
  category: 'performance' | 'compatibility' | 'features';
  isImportant?: boolean;
}

interface BuildComponent {
  id: string;
  name: string;
  model: string;
  brand: string;
  price: number;
  currency: 'UZS' | 'USD';
  images: string[];
  specifications: ComponentSpec[];
  category: ComponentCategory;
  compatibility: CompatibilityInfo;
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewCount: number;
  features: string[];
  powerConsumption?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface CompatibilityInfo {
  socketType?: string;
  memoryType?: string;
  powerRequirement?: number;
  maxTDP?: number;
  supportedFeatures: string[];
  restrictions: string[];
}

type ComponentCategory = 
  | 'cpu' | 'motherboard' | 'memory' | 'gpu' | 'storage' 
  | 'psu' | 'case' | 'cooling' | 'peripherals';

interface PCBuildState {
  [key in ComponentCategory]?: BuildComponent | BuildComponent[];
}

interface BuildValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  powerRequirement: number;
  estimatedPerformance: {
    gaming: number;
    productivity: number;
    content: number;
  };
  compatibilityScore: number;
}

interface ValidationError {
  component: ComponentCategory;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  suggestion?: string;
}

interface ValidationWarning {
  component: ComponentCategory;
  message: string;
  impact: 'performance' | 'compatibility' | 'future';
}

// Professional utility functions
const cn = (...classes: (string | undefined | null | false)[]) => {
  return twMerge(clsx(...classes));
};

const formatPrice = (price: number, currency: 'UZS' | 'USD' = 'UZS'): string => {
  if (currency === 'UZS') {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  }
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(price);
};

const componentSteps: Array<{
  id: ComponentCategory;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  required: boolean;
  order: number;
}> = [
  {
    id: 'cpu',
    title: 'Protsessor (CPU)',
    description: 'Kompyuteringiz uchun asosiy hisoblash bloki',
    icon: CpuChipIcon,
    required: true,
    order: 1
  },
  // ... existing code ... boshqa componentlar
];

// Professional PC Builder Component
const PCBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Professional state management
  const [currentBuild, setCurrentBuild] = useState<PCBuildState>({});
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('cpu');
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [viewMode, setViewMode] = useState<'wizard' | 'list'>('wizard');

  // Professional API queries
  const { data: availableComponents, isLoading: componentsLoading } = useQuery({
    queryKey: ['components', selectedCategory, currentBuild],
    queryFn: () => fetchCompatibleComponents(selectedCategory, currentBuild),
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  const { data: buildValidation, isLoading: validationLoading } = useQuery({
    queryKey: ['buildValidation', currentBuild],
    queryFn: () => validateBuildCompatibility(currentBuild),
    enabled: Object.keys(currentBuild).length > 0,
    refetchOnWindowFocus: false,
  });

  const saveBuildMutation = useMutation({
    mutationFn: saveBuild,
    onSuccess: () => {
      toast.success('Build muvaffaqiyatli saqlandi!');
      setIsSaveDialogOpen(false);
      setBuildName('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Build saqlanmadi');
    },
  });

  // Professional component selection handler
  const handleComponentSelect = (component: BuildComponent) => {
    setCurrentBuild(prev => ({
      ...prev,
      [selectedCategory]: component
    }));
    setIsComponentDialogOpen(false);
    toast.success(`${component.name} tanlandi!`);
  };

  const removeComponent = (category: ComponentCategory) => {
    setCurrentBuild(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    toast.success('Komponent olib tashlandi');
  };

  const totalPrice = Object.values(currentBuild).reduce((sum, component) => {
    if (Array.isArray(component)) {
      return sum + component.reduce((compSum, comp) => compSum + comp.price, 0);
    }
    return sum + (component?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CpuChipIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">PC Builder</h1>
                <p className="text-sm text-slate-600">Professional kompyuter yig'ish platformasi</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'wizard' ? 'list' : 'wizard')}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {viewMode === 'wizard' ? 'List View' : 'Wizard'}
              </button>
              
              <button
                onClick={() => setIsSaveDialogOpen(true)}
                disabled={Object.keys(currentBuild).length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <BookmarkIcon className="h-4 w-4 inline mr-2" />
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Build Summary - Professional Design */}
          <div className="lg:col-span-1 space-y-6">
            {/* Price Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Jami Narx</h3>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatPrice(totalPrice)}
                </p>
              </div>
              
              <div className="p-6">
                {buildValidation && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Mos kelish darajasi:</span>
                      <span className="font-semibold text-green-600">
                        {buildValidation.compatibilityScore}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Quvvat talabi:</span>
                      <span className="font-semibold">
                        {buildValidation.powerRequirement}W
                      </span>
                    </div>
                    
                    {/* Performance Indicators */}
                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Gaming:</span>
                          <span className="font-medium">{buildValidation.estimatedPerformance.gaming}/10</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Productivity:</span>
                          <span className="font-medium">{buildValidation.estimatedPerformance.productivity}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Validation Alerts */}
            {buildValidation?.errors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Muammolar</h4>
                    <ul className="text-sm text-red-700 mt-1 space-y-1">
                      {buildValidation.errors.map((error, index) => (
                        <li key={index}>• {error.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Component Selection - Professional UI */}
          <div className="lg:col-span-2">
            {viewMode === 'wizard' ? (
              <ComponentWizard 
                steps={componentSteps}
                currentBuild={currentBuild}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                onComponentSelect={handleComponentSelect}
                onComponentRemove={removeComponent}
                availableComponents={availableComponents}
                isLoading={componentsLoading}
              />
            ) : (
              <ComponentList 
                components={componentSteps}
                currentBuild={currentBuild}
                onComponentSelect={handleComponentSelect}
                onComponentRemove={removeComponent}
              />
            )}
          </div>
        </div>
      </main>

      {/* Professional Component Selection Dialog */}
      <ComponentSelectionDialog 
        isOpen={isComponentDialogOpen}
        onClose={() => setIsComponentDialogOpen(false)}
        category={selectedCategory}
        components={availableComponents}
        onSelect={handleComponentSelect}
        isLoading={componentsLoading}
      />

      {/* Save Build Dialog */}
      <SaveBuildDialog 
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        buildName={buildName}
        onBuildNameChange={setBuildName}
        onSave={() => saveBuildMutation.mutate({ name: buildName, build: currentBuild })}
        isLoading={saveBuildMutation.isPending}
      />
    </div>
  );
};

// Professional Component Wizard
interface ComponentWizardProps {
  steps: typeof componentSteps;
  currentBuild: PCBuildState;
  selectedCategory: ComponentCategory;
  onCategorySelect: (category: ComponentCategory) => void;
  onComponentSelect: (component: BuildComponent) => void;
  onComponentRemove: (category: ComponentCategory) => void;
  availableComponents?: BuildComponent[];
  isLoading: boolean;
}

const ComponentWizard: React.FC<ComponentWizardProps> = ({
  steps,
  currentBuild,
  selectedCategory,
  onCategorySelect,
  onComponentSelect,
  onComponentRemove,
  availableComponents = [],
  isLoading
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100">
      {/* Wizard Steps */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const isSelected = step.id === selectedCategory;
            const isCompleted = !!currentBuild[step.id];
            
            return (
              <button
                key={step.id}
                onClick={() => onCategorySelect(step.id)}
                className={cn(
                  'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isSelected 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                    : isCompleted
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-150'
                )}
              >
                <step.icon className="h-4 w-4 mr-2" />
                {step.title}
                {isCompleted && <CheckCircleIconSolid className="h-4 w-4 ml-2 text-green-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-slate-600">Komponentlar yuklanmoqda...</span>
          </div>
        ) : (
          <ComponentGrid 
            components={availableComponents}
            selectedCategory={selectedCategory}
            onSelect={onComponentSelect}
            currentSelection={currentBuild[selectedCategory] as BuildComponent}
          />
        )}
      </div>
    </div>
  );
};

// Component Grid
interface ComponentGridProps {
  components: BuildComponent[];
  selectedCategory: ComponentCategory;
  onSelect: (component: BuildComponent) => void;
  currentSelection?: BuildComponent;
}

const ComponentGrid: React.FC<ComponentGridProps> = ({
  components,
  selectedCategory,
  onSelect,
  currentSelection
}) => {
  if (components.length === 0) {
    return (
      <div className="text-center py-12">
        <CpuChipIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Komponentlar topilmadi</h3>
        <p className="text-slate-600">
          {selectedCategory} uchun mos komponentlar hozircha mavjud emas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {components.map((component) => (
        <ComponentCard 
          key={component.id}
          component={component}
          isSelected={currentSelection?.id === component.id}
          onSelect={() => onSelect(component)}
        />
      ))}
    </div>
  );
};

// Professional Component Card
interface ComponentCardProps {
  component: BuildComponent;
  isSelected: boolean;
  onSelect: () => void;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ component, isSelected, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'border rounded-xl p-4 cursor-pointer transition-all duration-200',
        isSelected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      )}
      onClick={onSelect}
    >
      {/* Component Image */}
      <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden">
        {component.images[0] ? (
          <img 
            src={component.images[0]} 
            alt={component.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CpuChipIcon className="h-12 w-12 text-slate-400" />
          </div>
        )}
      </div>

      {/* Component Info */}
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-slate-900 line-clamp-1">{component.name}</h4>
          <p className="text-sm text-slate-600">{component.brand} • {component.model}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon 
                key={i}
                className={cn(
                  'h-4 w-4',
                  i < Math.floor(component.rating) ? 'text-yellow-400 fill-current' : 'text-slate-300'
                )}
              />
            ))}
          </div>
          <span className="text-slate-600">({component.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(component.price, component.currency)}
          </span>
          
          <div className="flex items-center text-sm">
            {component.inStock ? (
              <span className="text-green-600 font-medium">Mavjud</span>
            ) : (
              <span className="text-red-600 font-medium">Tugagan</span>
            )}
          </div>
        </div>

        {/* Key Specs */}
        <div className="pt-2 border-t border-slate-100">
          <div className="space-y-1">
            {component.specifications.slice(0, 3).map((spec, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-slate-600">{spec.name}:</span>
                <span className="font-medium text-slate-900">
                  {spec.value}{spec.unit && ` ${spec.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircleIconSolid className="h-6 w-6 text-blue-600" />
        </div>
      )}
    </motion.div>
  );
};

// Professional API functions (TypeScript)
const fetchCompatibleComponents = async (
  category: ComponentCategory, 
  currentBuild: PCBuildState
): Promise<BuildComponent[]> => {
  const response = await fetch('/api/v1/pc-builder/components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, currentBuild })
  });
  
  if (!response.ok) {
    throw new Error('Komponentlar yuklanmadi');
  }
  
  return response.json();
};

const validateBuildCompatibility = async (build: PCBuildState): Promise<BuildValidation> => {
  const response = await fetch('/api/v1/pc-builder/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ build })
  });
  
  return response.json();
};

const saveBuild = async (data: { name: string; build: PCBuildState }) => {
  const response = await fetch('/api/v1/pc-builder/builds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Build saqlanmadi');
  }
  
  return response.json();
};

export default PCBuilderPage;
