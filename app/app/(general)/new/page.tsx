export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <form className="w-full max-w-md bg-white rounded-lg shadow p-6 flex flex-col gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">KML / KMZ ファイルを選択</span>
          <input
            type="file"
            accept=".kml, .kmz"
            className="mt-2 block w-full text-sm text-gray-600
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#0078a8] file:text-white
                      hover:file:bg-[#006890]
                      cursor-pointer"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-[#0078a8] text-white py-2 rounded-md font-medium hover:bg-[#006890] transition"
        >
          新規作成
        </button>
      </form>
    </div>
  );
}
