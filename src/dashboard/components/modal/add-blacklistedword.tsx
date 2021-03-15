import { FC, FormEvent, useState } from "react";
import Modal, { closeModal } from "./index";
import Logger from "../../../modules/Logger";
import AlertMessage from "../AlertMessage";
import { useRouter } from "next/router";
import Guild from "../../../interfaces/Guild";

interface Props {
  guild: Guild;
}

const AddBlacklistedWord: FC<Props> = ({ guild }: Props) => {
  const [word, setWord] = useState("");
  const [response, setResponse] = useState<{ error: string } | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch(
        `${process.env["NEXT_PUBLIC_DASHBOARD_URL"]}/api/guilds/${guild.id}/blacklisted-words`,
        {
          method: "POST",
          body: JSON.stringify({
            word,
          }),
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        closeModal("addBlacklistedWord");
        setWord("");
        setResponse(null);
        router.push(
          `/dashboard/${guild.id}/blacklisted-words?message=Successfully blacklisted word: ${word}`
        );
      }

      setResponse(data);
    } catch (e) {
      Logger.error("add_blacklisted_word", e?.stack || e);
    }
  }

  return (
    <Modal id="addBlacklistedWord" title="Add blacklisted word">
      {response?.error ? <AlertMessage message={response?.error} /> : null}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="word">Enter word</label>
          <input
            id="word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="float-right">
          <button className="btn btn-primary" type="submit">
            Add word
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddBlacklistedWord;
