import Spinner from "./ui/Spinner";

const Loading = ({ full = true }) => {
  return (
    <div className={`flex items-center justify-center ${full ? "min-h-screen" : "min-h-[40vh]"}`}>
      <Spinner />
    </div>
  );
};

export default Loading;
