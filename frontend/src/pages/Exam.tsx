const Exam = () => {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Exam: Final Assessment</h1>
            <div className="space-y-6">
                <div className="p-4 border border-gray-200 rounded">
                    <p className="font-semibold mb-2">1. What is React?</p>
                    <div className="space-y-2">
                        <label className="block"><input type="radio" name="q1" className="mr-2" /> A library for UI</label>
                        <label className="block"><input type="radio" name="q1" className="mr-2" /> A database</label>
                    </div>
                </div>
            </div>
            <button className="mt-8 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Submit Exam
            </button>
        </div>
    );
};

export default Exam;
