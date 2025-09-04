export default function Page() {
  return (
    <main>
      <header>
        <h1>Mission Map</h1>
      </header>

      {/* <form className="flex flex-col gap-1 w-140 border-1 p-1">
        <input type="text" placeholder="Map ID" className="p-1 outline-1" />
        <input type="text" placeholder="Map Name" className="p-1 outline-1" />
        <input type="date" className="p-1 outline-1" />

        <fieldset>
          <legend>Status List</legend>
          <div className="flex gap-1">
            <input type="text" placeholder="Name" className="p-1 outline-1" />
            <input type="text" placeholder="Color" className="p-1 outline-1" />
          </div>
        </fieldset>

        <button className="p-1 outline-1">新規作成</button>
      </form> */}

      <form className="flex flex-col gap-1 w-140 border-1 p-1">
        <input type="file" className="p-1 outline-1" />
        <button className="p-1 outline-1">新規作成</button>
      </form>
    </main>
  );
}
